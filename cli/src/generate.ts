import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type AppType, composeWorkspace, copyTemplate } from './compose.ts'
import { type Answers, writeContext } from './context.ts'
import { setJsonc } from './jsonc.ts'
import { schemeFor } from './names.ts'

async function rewrite(path: string, change: (text: string) => string): Promise<void> {
  await writeFile(path, change(await readFile(path, 'utf8')))
}

async function nameProject(root: string, name: string): Promise<void> {
  await rewrite(join(root, 'package.json'), (text) => setJsonc(text, ['name'], name))
  await rewrite(join(root, 'README.md'), (text) => text.replace(/^# .*$/m, `# ${name}`))
}

async function nameMobileApp(app: string, name: string): Promise<void> {
  await rewrite(join(app, 'app.json'), (text) => {
    let result = setJsonc(text, ['expo', 'name'], name)
    result = setJsonc(result, ['expo', 'slug'], name)
    return setJsonc(result, ['expo', 'scheme'], schemeFor(name))
  })
}

const SECRET_LINE = /^BETTER_AUTH_SECRET=.*$/m

// `.env` stays out of git, so the example is the committed truth and a fresh project gets a copy it can start with.
// Only the secret differs: a sample value is public, so every generated API draws its own.
async function writeLocalEnv(app: string, type: AppType): Promise<void> {
  const example = join(app, '.env.example')

  if (!existsSync(example)) {
    return
  }

  let env = await readFile(example, 'utf8')

  if (type === 'api') {
    if (!SECRET_LINE.test(env)) {
      throw new Error(`${example} no longer carries a BETTER_AUTH_SECRET line`)
    }
    env = env.replace(SECRET_LINE, `BETTER_AUTH_SECRET=${randomBytes(32).toString('base64url')}`)
  }

  await writeFile(join(app, '.env'), env)
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`)
  }
}

export async function generate({
  templates,
  knowledge,
  target,
  answers,
  install,
}: {
  templates: string
  knowledge: string
  target: string
  answers: Answers
  install: boolean
}): Promise<void> {
  if (existsSync(target) && (await readdir(target)).length > 0) {
    throw new Error(`${target} already exists and is not empty.`)
  }

  const [only] = answers.types

  if (answers.architecture === 'alone' && only !== undefined) {
    await copyTemplate(join(templates, only), target)
    await nameProject(target, answers.name)
    await writeLocalEnv(target, only)

    if (only === 'mobile') {
      await nameMobileApp(target, answers.name)
    }
  } else {
    await composeWorkspace({
      templates,
      target,
      types: answers.types,
      mobileScheme: schemeFor(answers.name),
    })
    await nameProject(target, answers.name)

    for (const type of answers.types) {
      await writeLocalEnv(join(target, 'apps', type), type)
    }

    if (answers.types.includes('mobile')) {
      await nameMobileApp(join(target, 'apps', 'mobile'), answers.name)
    }
  }

  await writeContext(knowledge, target, answers)

  run('git', ['init', '--quiet'], target)

  if (install) {
    run('pnpm', ['install'], target)
    // Rewriting the contract import changes import grouping and line length; only the formatter can settle both.
    run('pnpm', ['exec', 'biome', 'check', '--write'], target)
  }
}
