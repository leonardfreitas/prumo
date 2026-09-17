import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { connect } from 'node:net'
import { join } from 'node:path'

export type Status = 'ok' | 'warn' | 'fail'

export type Check = {
  id: string
  label: string
  status: Status
  detail: string
  required: boolean
}

export type Report = { ready: boolean; checks: Check[] }

export type Probe = {
  nodeVersion: string
  run: (command: string, args: string[]) => { ok: boolean; stdout: string }
  exists: (path: string) => boolean
  list: (directory: string) => string[]
  portOpen: (host: string, port: number) => Promise<boolean>
}

const NODE_FLOOR = [22, 17, 0]

export const systemProbe: Probe = {
  nodeVersion: process.versions.node,
  run: (command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10_000 })

    return { ok: result.error === undefined && result.status === 0, stdout: result.stdout ?? '' }
  },
  exists: existsSync,
  list: (directory) => (existsSync(directory) ? readdirSync(directory) : []),
  portOpen: (host, port) =>
    new Promise((done) => {
      const socket = connect({ host, port, timeout: 2000 })
      const finish = (open: boolean) => {
        socket.destroy()
        done(open)
      }
      socket.once('connect', () => finish(true))
      socket.once('timeout', () => finish(false))
      socket.once('error', () => finish(false))
    }),
}

function atLeast(version: string, floor: number[]): boolean {
  const parts = version.split('.').map(Number)

  for (const [index, minimum] of floor.entries()) {
    const part = parts[index] ?? 0
    if (part !== minimum) {
      return part > minimum
    }
  }

  return true
}

function newestFirst(entries: string[]): string[] {
  return [...entries].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

// The same places the API template's scripts/database.mjs looks, since that script is what needs psql.
function findPsql(probe: Probe): string | undefined {
  if (probe.run('psql', ['--version']).ok) {
    return 'psql'
  }

  const candidates = [
    ...newestFirst(probe.list('/Library/PostgreSQL')).map((version) =>
      join('/Library/PostgreSQL', version, 'bin/psql'),
    ),
    '/Applications/Postgres.app/Contents/Versions/latest/bin/psql',
    ...['/opt/homebrew/opt', '/usr/local/opt'].flatMap((parent) =>
      newestFirst(probe.list(parent).filter((entry) => entry.startsWith('postgresql'))).map(
        (entry) => join(parent, entry, 'bin/psql'),
      ),
    ),
  ]

  return candidates.find((candidate) => probe.exists(candidate))
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? ''
}

export async function doctor(probe: Probe = systemProbe): Promise<Report> {
  const checks: Check[] = []

  checks.push({
    id: 'node',
    label: 'Node',
    required: true,
    ...(atLeast(probe.nodeVersion, NODE_FLOOR)
      ? { status: 'ok', detail: probe.nodeVersion }
      : { status: 'fail', detail: `${probe.nodeVersion}; 22.17.0 or later is required` }),
  })

  for (const [id, label, why] of [
    ['pnpm', 'pnpm', 'installs and runs every generated project'],
    ['git', 'git', 'every generated project starts as a repository'],
  ] as const) {
    const result = probe.run(id, ['--version'])

    checks.push({
      id,
      label,
      required: true,
      ...(result.ok
        ? { status: 'ok', detail: firstLine(result.stdout) }
        : { status: 'fail', detail: `not found; it ${why}` }),
    })
  }

  const docker = probe.run('docker', ['--version'])
  const dockerRunning = docker.ok && probe.run('docker', ['info']).ok

  checks.push({
    id: 'docker',
    label: 'Docker',
    required: false,
    ...(dockerRunning
      ? { status: 'ok', detail: firstLine(docker.stdout) }
      : {
          status: 'warn',
          detail: docker.ok
            ? 'installed but not running; the API tests and its Docker database need it'
            : 'not found; the API tests and its Docker database need it',
        }),
  })

  const psql = findPsql(probe)
  const psqlVersion = psql === undefined ? undefined : probe.run(psql, ['--version'])

  checks.push({
    id: 'psql',
    label: 'psql',
    required: false,
    ...(psql === undefined
      ? { status: 'warn', detail: 'not found; needed to create a database on a local Postgres' }
      : {
          status: 'ok',
          detail: `${firstLine(psqlVersion?.stdout ?? '')}${psql === 'psql' ? '' : ` at ${psql}`}`,
        }),
  })

  const serverUp = await probe.portOpen('localhost', 5432)

  checks.push({
    id: 'postgres',
    label: 'Postgres on localhost:5432',
    required: false,
    ...(serverUp
      ? { status: 'ok', detail: 'answering; the API needs version 18 or later' }
      : { status: 'warn', detail: 'nothing answers' }),
  })

  const database = (serverUp && psql !== undefined) || dockerRunning

  checks.push({
    id: 'database',
    label: 'A database for the API',
    required: false,
    ...(database
      ? {
          status: 'ok',
          detail: serverUp && psql !== undefined ? 'local Postgres' : 'Docker',
        }
      : {
          status: 'warn',
          detail: 'neither a local Postgres with psql nor a running Docker; `prumo db` cannot work',
        }),
  })

  return { ready: checks.every((check) => !check.required || check.status === 'ok'), checks }
}

const SYMBOL: Record<Status, string> = { ok: '✓', warn: '!', fail: '✗' }

export function doctorText(report: Report): string {
  const width = Math.max(...report.checks.map((check) => check.label.length))
  const lines = report.checks.map(
    (check) => `${SYMBOL[check.status]} ${check.label.padEnd(width)}  ${check.detail}`,
  )

  lines.push(
    '',
    report.ready ? 'Ready.' : 'Not ready: fix what is marked ✗ before generating a project.',
  )

  return lines.join('\n')
}
