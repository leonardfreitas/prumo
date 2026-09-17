export type CommandHelp = {
  name: string
  usage: string
  summary: string
  options: { flag: string; description: string }[]
}

const JSON_OPTION = {
  flag: '--json',
  description: 'Print one JSON document on stdout and never prompt',
}

export const COMMANDS: CommandHelp[] = [
  {
    name: 'new',
    usage: 'prumo new [name] [options]',
    summary: 'Generate a project and the .prumo/ context it follows',
    options: [
      { flag: '--types <list>', description: 'Comma-separated: api, web, mobile, site' },
      { flag: '--alone', description: 'One project of one type' },
      { flag: '--monorepo', description: 'A workspace, even for a single type' },
      { flag: '--multi-tenant', description: 'Tenant-aware api, web and mobile' },
      { flag: '--single-tenant', description: 'No tenancy' },
      { flag: '--skip-install', description: 'Do not run pnpm install' },
      JSON_OPTION,
    ],
  },
  {
    name: 'db',
    usage: 'prumo db [options]',
    summary: "Create the development database and write its URL into the API's .env",
    options: [
      { flag: '--name <name>', description: 'Database name; asked when omitted' },
      { flag: '--local', description: 'Use the Postgres on this machine only' },
      { flag: '--docker', description: "Use the project's docker-compose.yml only" },
      { flag: '--host <host>', description: 'Postgres host, localhost by default' },
      { flag: '--port <port>', description: 'Postgres port, 5432 by default' },
      { flag: '--user <user>', description: 'Postgres user for a local server' },
      { flag: '--password <password>', description: 'Its password; PGPASSWORD also works' },
      { flag: '--skip-migrate', description: 'Do not run pnpm db:migrate afterwards' },
      JSON_OPTION,
    ],
  },
  {
    name: 'clean',
    usage: 'prumo clean [options]',
    summary: 'Remove what a project needed only once, such as the database setup',
    options: [
      { flag: '--dry-run', description: 'List what would be removed, and change nothing' },
      { flag: '--yes', description: 'Do not ask for confirmation; required without a terminal' },
      { flag: '--force', description: 'Clean even while DATABASE_URL is still MISSING' },
      JSON_OPTION,
    ],
  },
  {
    name: 'doctor',
    usage: 'prumo doctor',
    summary: 'Check that this machine has what a Prumo project needs',
    options: [JSON_OPTION],
  },
  {
    name: 'version',
    usage: 'prumo version',
    summary: 'Print the CLI version',
    options: [JSON_OPTION],
  },
  {
    name: 'help',
    usage: 'prumo help [command]',
    summary: 'List the commands, or describe one',
    options: [JSON_OPTION],
  },
]

export function findCommand(name: string): CommandHelp | undefined {
  return COMMANDS.find((command) => command.name === name)
}

function columns(rows: [string, string][]): string {
  const width = Math.max(...rows.map(([left]) => left.length))

  return rows.map(([left, right]) => `  ${left.padEnd(width)}  ${right}`).join('\n')
}

export function helpText(command?: CommandHelp): string {
  if (command !== undefined) {
    return `Usage: ${command.usage}\n\n${command.summary}\n\nOptions:\n${columns(
      command.options.map((option) => [option.flag, option.description]),
    )}`
  }

  return `Usage: prumo <command> [options]\n\nCommands:\n${columns(
    COMMANDS.map((entry) => [entry.name, entry.summary]),
  )}\n\nOptions:\n${columns([
    ['-h, --help', 'Show help; `prumo <command> --help` for one command'],
    ['-v, --version', 'Print the CLI version'],
    [JSON_OPTION.flag, JSON_OPTION.description],
  ])}`
}
