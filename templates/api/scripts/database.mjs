// Creates the development database and writes its URL into .env.
//
//   node scripts/database.mjs            creates a database, whatever .env holds
//   node scripts/database.mjs --check    does nothing unless DATABASE_URL is still MISSING; `pnpm dev` runs this
//
// A Postgres already listening on localhost is used first; without one, the Docker service in docker-compose.yml.
// It needs no dependency, so it runs before `pnpm install` has finished anything but Node itself.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { userInfo } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

const MISSING = 'MISSING'
const MINIMUM_SERVER_VERSION = 180000
const DOCKER_USER = 'app'
const DOCKER_PASSWORD = 'app'
const NAME = /^[a-z_][a-z0-9_]{0,62}$/
// Never prompt for a password, stop at the first error, print bare values, and read the SQL from stdin.
const PSQL_SCRIPT = ['-w', '-v', 'ON_ERROR_STOP=1', '-tAq', '-f', '-']

const api = resolve(import.meta.dirname, '..')
const envPath = join(api, '.env')

const { values } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    name: { type: 'string' },
    local: { type: 'boolean', default: false },
    docker: { type: 'boolean', default: false },
    host: { type: 'string', default: 'localhost' },
    port: { type: 'string', default: '5432' },
    user: { type: 'string' },
    password: { type: 'string' },
    'skip-migrate': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
  },
})

const json = values.json
const interactive = !json && process.stdin.isTTY === true && process.stdout.isTTY === true

class Failure extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function say(message) {
  ;(json ? process.stderr : process.stdout).write(`${message}\n`)
}

function needsInput(what, flag) {
  return new Failure(
    'needs_input',
    `${what} is required. Outside an interactive terminal, pass ${flag}.`,
  )
}

async function ask(question, fallback) {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  const suffix = fallback === undefined ? '' : ` (${fallback})`
  const answer = (await readline.question(`${question}${suffix}: `)).trim()
  readline.close()
  return answer === '' ? fallback : answer
}

async function confirm(question) {
  const answer = await ask(`${question} [Y/n]`)
  return answer === undefined || /^y(es)?$/i.test(answer)
}

async function askSecret(question) {
  const readline = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  process.stdout.write(`${question}: `)
  // Echo nothing while the password is typed.
  readline._writeToOutput = () => {}
  const answer = await readline.question('')
  readline.close()
  process.stdout.write('\n')
  return answer
}

function readEnv() {
  return existsSync(envPath) ? readFileSync(envPath, 'utf8') : undefined
}

function envValue(env, key) {
  return new RegExp(`^${key}=(.*)$`, 'm').exec(env)?.[1]?.trim()
}

function withEnvValue(env, key, value) {
  const line = new RegExp(`^${key}=.*$`, 'm')
  return line.test(env)
    ? env.replace(line, `${key}=${value}`)
    : `${env.replace(/\n?$/, '\n')}${key}=${value}\n`
}

function defaultName() {
  let directory = api

  // The project root is where .prumo/ lives: the api itself when alone, two levels up in a workspace.
  while (!existsSync(join(directory, '.prumo')) && dirname(directory) !== directory) {
    directory = dirname(directory)
  }

  const root = existsSync(join(directory, '.prumo')) ? directory : api
  const name = basename(root)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')

  return NAME.test(name) ? name : `app_${name}`.slice(0, 63)
}

function commandExists(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).error === undefined
}

function versionedDirectories(parent, suffix) {
  if (!existsSync(parent)) {
    return []
  }

  return readdirSync(parent)
    .map((entry) => join(parent, entry, suffix))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

// macOS installers leave psql off PATH: the EDB installer, Postgres.app and a keg-only Homebrew formula all do.
function findPsql() {
  const candidates = [
    'psql',
    ...versionedDirectories('/Library/PostgreSQL', 'bin/psql'),
    '/Applications/Postgres.app/Contents/Versions/latest/bin/psql',
    ...['/opt/homebrew/opt', '/usr/local/opt'].flatMap((parent) =>
      existsSync(parent)
        ? readdirSync(parent)
            .filter((entry) => entry.startsWith('postgresql'))
            .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
            .map((entry) => join(parent, entry, 'bin/psql'))
        : [],
    ),
  ]

  return candidates.find((candidate) =>
    candidate === 'psql' ? commandExists('psql') : existsSync(candidate),
  )
}

function portOpen(host, port) {
  return new Promise((done) => {
    const socket = connect({ host, port: Number(port), timeout: 2000 })
    const finish = (open) => {
      socket.destroy()
      done(open)
    }
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

function classify(stderr) {
  if (
    /password authentication failed|no password supplied|role ".*" does not exist|authentication failed/i.test(
      stderr,
    )
  ) {
    return 'auth'
  }
  if (/connection refused|could not connect|timeout expired|is the server running/i.test(stderr)) {
    return 'unreachable'
  }
  return 'error'
}

// One way to run SQL, whichever server answers: the local psql, or psql inside the Docker service.
function localServer({ psql, host, port, user, password }) {
  return {
    source: 'local',
    host,
    port,
    user,
    password,
    sql(database, text) {
      return spawnSync(psql, ['-h', host, '-p', port, '-U', user, '-d', database, ...PSQL_SCRIPT], {
        input: text,
        encoding: 'utf8',
        env: { ...process.env, PGPASSWORD: password ?? '', PGCONNECT_TIMEOUT: '5' },
      })
    },
  }
}

function dockerServer(port) {
  return {
    source: 'docker',
    host: 'localhost',
    port,
    user: DOCKER_USER,
    password: DOCKER_PASSWORD,
    sql(database, text) {
      return spawnSync(
        'docker',
        [
          'compose',
          'exec',
          '-T',
          'postgres',
          'psql',
          '-U',
          DOCKER_USER,
          '-d',
          database,
          ...PSQL_SCRIPT,
        ],
        { cwd: api, input: text, encoding: 'utf8' },
      )
    },
  }
}

function query(server, database, text) {
  const result = server.sql(database, text)

  if (result.error !== undefined || result.status !== 0) {
    const stderr = result.stderr?.trim() || result.error?.message || 'psql failed'
    throw new Failure(classify(stderr) === 'auth' ? 'postgres_auth' : 'postgres_error', stderr)
  }

  return result.stdout.trim()
}

async function connectLocal(psql) {
  let user = values.user ?? process.env.PGUSER ?? userInfo().username
  let password = values.password ?? process.env.PGPASSWORD

  for (let attempt = 0; ; attempt += 1) {
    const server = localServer({ psql, host: values.host, port: values.port, user, password })
    const result = server.sql('postgres', 'SHOW server_version_num')

    if (result.error === undefined && result.status === 0) {
      return { server, version: Number(result.stdout.trim()) }
    }

    const stderr = result.stderr?.trim() ?? ''
    const kind = classify(stderr)

    if (kind === 'unreachable') {
      return undefined
    }
    if (kind !== 'auth') {
      throw new Failure('postgres_error', stderr)
    }
    if (!interactive || attempt === 2) {
      throw new Failure(
        'postgres_auth',
        `Postgres on ${values.host}:${values.port} refused ${user}. ${stderr}`,
      )
    }

    say(`Postgres on ${values.host}:${values.port} refused ${user}.`)
    user = await ask('Postgres user', user)
    password = await askSecret('Password')
  }
}

function startDocker() {
  if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
    throw new Failure(
      'postgres_unavailable',
      'No Postgres answers on localhost, and Docker is not running.',
    )
  }

  say('Starting Postgres with docker compose…')
  const result = spawnSync('docker', ['compose', 'up', '-d', '--wait'], {
    cwd: api,
    stdio: ['ignore', json ? 2 : 'inherit', 'inherit'],
  })

  if (result.status !== 0) {
    throw new Failure('docker_failed', '`docker compose up -d --wait` failed.')
  }

  const server = dockerServer(values.port)
  return { server, version: Number(query(server, 'postgres', 'SHOW server_version_num')) }
}

async function pickServer() {
  if (values.local && values.docker) {
    throw new Failure('usage', 'Choose --local or --docker, not both.')
  }

  if (!values.docker) {
    const psql = findPsql()

    if (psql !== undefined) {
      const local = await connectLocal(psql)
      if (local !== undefined) {
        return local
      }
    } else if (await portOpen(values.host, values.port)) {
      throw new Failure(
        'postgres_unavailable',
        `Something listens on ${values.host}:${values.port}, but psql is not on PATH to create the database.`,
      )
    }

    if (values.local) {
      throw new Failure(
        'postgres_unavailable',
        `No Postgres answers on ${values.host}:${values.port}.`,
      )
    }
  }

  if (!commandExists('docker')) {
    throw new Failure(
      'postgres_unavailable',
      'No Postgres answers on localhost, and Docker is not installed.',
    )
  }

  if (
    interactive &&
    !values.docker &&
    !(await confirm('No local Postgres answers. Start the one in docker-compose.yml?'))
  ) {
    throw new Failure('declined', 'Nothing was created.')
  }

  return startDocker()
}

function urlFor(server, database) {
  const password = server.password ? `:${encodeURIComponent(server.password)}` : ''
  return `postgresql://${encodeURIComponent(server.user)}${password}@${server.host}:${server.port}/${database}`
}

async function main() {
  const env = readEnv()

  if (values.check) {
    // No .env, or a URL someone already chose: the API's own validation has the last word.
    if (env === undefined || envValue(env, 'DATABASE_URL') !== MISSING) {
      return undefined
    }
    if (!interactive) {
      throw new Failure(
        'database_missing',
        'DATABASE_URL is MISSING in .env. Run `pnpm db:setup` first.',
      )
    }
    say('DATABASE_URL in .env is still MISSING.')
    if (!(await confirm('Create a development database now?'))) {
      throw new Failure('declined', 'DATABASE_URL is MISSING. Run `pnpm db:setup` when ready.')
    }
  }

  if (env === undefined) {
    throw new Failure('env_missing', `${envPath} does not exist. Copy .env.example to .env first.`)
  }

  const name = values.name ?? (interactive ? await ask('Database name', defaultName()) : undefined)

  if (name === undefined) {
    throw needsInput('The database name', '--name')
  }
  if (!NAME.test(name)) {
    throw new Failure(
      'invalid_name',
      `"${name}" is not a valid name: lowercase letters, digits and _, not starting with a digit.`,
    )
  }

  const { server, version } = await pickServer()

  if (version < MINIMUM_SERVER_VERSION) {
    throw new Failure(
      'postgres_version',
      `Postgres 18 or later is required; the server reports ${version}.`,
    )
  }

  const exists =
    query(server, 'postgres', `SELECT 1 FROM pg_database WHERE datname = '${name}'`) === '1'

  if (exists) {
    say(`Database ${name} already exists; using it.`)
  } else {
    query(server, 'postgres', `CREATE DATABASE "${name}"`)
    say(`Created database ${name} (${server.source}).`)
  }

  // The same scripts the Docker image runs on first start, so both servers end up with the same schemas.
  const init = join(api, 'docker', 'init')
  for (const file of readdirSync(init)
    .filter((entry) => entry.endsWith('.sql'))
    .sort()) {
    query(server, name, readFileSync(join(init, file), 'utf8'))
  }

  const url = urlFor(server, name)
  writeFileSync(
    envPath,
    withEnvValue(withEnvValue(readEnv() ?? env, 'DATABASE_URL', url), 'AUTH_DATABASE_URL', url),
  )
  say('Wrote DATABASE_URL and AUTH_DATABASE_URL to .env.')

  let migrated = false

  if (!values['skip-migrate']) {
    say('Migrating…')
    const result = spawnSync('pnpm', ['db:migrate'], {
      cwd: api,
      stdio: ['ignore', json ? 2 : 'inherit', 'inherit'],
    })
    if (result.status !== 0) {
      throw new Failure(
        'migrate_failed',
        '`pnpm db:migrate` failed. The database exists and .env points at it.',
      )
    }
    migrated = true
  }

  return {
    database: name,
    source: server.source,
    host: server.host,
    port: server.port,
    user: server.user,
    created: !exists,
    migrated,
  }
}

try {
  const data = await main()
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: true, command: 'db', data: data ?? null })}\n`)
  }
} catch (error) {
  const code = error instanceof Failure ? error.code : 'unexpected'
  const message = error instanceof Error ? error.message : String(error)

  if (json) {
    process.stdout.write(
      `${JSON.stringify({ ok: false, command: 'db', error: { code, message } })}\n`,
    )
  } else {
    process.stderr.write(`${message}\n`)
  }
  process.exitCode = 1
}
