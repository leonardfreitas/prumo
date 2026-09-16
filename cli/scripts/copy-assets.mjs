import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const repository = resolve(import.meta.dirname, '../..')
const here = resolve(import.meta.dirname, '..')

// npm deletes these from a tarball wherever they sit, silently. Verified against npm 11.17.0.
const STRIPPED = new Set(['.gitignore', '.npmrc'])

// A template's .gitignore ships under a name npm keeps; the CLI restores the dot when it copies.
const PACKAGED_AS = { '.gitignore': 'gitignore' }

function packagedPath(file) {
  const name = basename(file)
  const renamed = PACKAGED_AS[name]

  return renamed === undefined ? file : join(dirname(file), renamed)
}

function assertNothingStripped(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && STRIPPED.has(entry.name)) {
      const path = join(entry.parentPath, entry.name)

      throw new Error(
        `${path} would be dropped by npm and the generated project would lose it. Add it to PACKAGED_AS.`,
      )
    }
  }
}

for (const source of ['templates', '.prumo-templates']) {
  rmSync(join(here, source), { recursive: true, force: true })

  // Only committed files ship: a template's local node_modules, .env or build output never reaches a user.
  const files = execFileSync('git', ['ls-files', source], { cwd: repository, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

  for (const file of files) {
    const target = join(here, packagedPath(file))
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(repository, file), target)
  }

  assertNothingStripped(join(here, source))
}

// npm reads the README from the package root, and two of them would diverge unseen.
cpSync(join(repository, 'README.md'), join(here, 'README.md'))
