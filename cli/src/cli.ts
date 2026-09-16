#!/usr/bin/env node
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import * as prompt from '@clack/prompts'
import { terminalAsker } from './asker.ts'
import { assetsFor, requireAssets } from './assets.ts'
import { generate } from './generate.ts'
import { validateProjectName } from './names.ts'
import { resolveAnswers } from './questions.ts'

const USAGE = `Usage: prumo new [name] [--types api,web,mobile,site] [--alone | --monorepo]
                  [--multi-tenant | --single-tenant] [--skip-install]`

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      types: { type: 'string' },
      alone: { type: 'boolean', default: false },
      monorepo: { type: 'boolean', default: false },
      'multi-tenant': { type: 'boolean', default: false },
      'single-tenant': { type: 'boolean', default: false },
      'skip-install': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  const [command, name] = positionals

  if (values.help || command !== 'new') {
    console.log(USAGE)
    process.exit(values.help ? 0 : 1)
  }

  const interactive = process.stdin.isTTY === true && process.stdout.isTTY === true
  const answers = await resolveAnswers(
    {
      name,
      types: values.types,
      alone: values.alone,
      monorepo: values.monorepo,
      multiTenant: values['multi-tenant'],
      singleTenant: values['single-tenant'],
    },
    interactive ? terminalAsker(validateProjectName) : undefined,
  )

  if (answers.types.length > 1) {
    prompt.log.info(
      `${answers.types.length} types make a workspace: apps/ and packages/ under one root.`,
    )
  }

  const here = import.meta.dirname

  await generate({
    ...requireAssets(assetsFor(here)),
    target: resolve(answers.name),
    answers,
    install: !values['skip-install'],
  })

  prompt.outro(`Created ${answers.name}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
