import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { composeWorkspace, copyTemplate } from './compose.ts'
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
