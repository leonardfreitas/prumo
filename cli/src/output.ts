// With --json, stdout carries exactly one document and everything meant for a person goes to stderr.
export type Envelope =
  | { ok: true; command: string; data: unknown }
  | { ok: false; command: string; error: { code: string; message: string }; data?: unknown }

export class CliError extends Error {
  readonly code: string
  readonly data: unknown

  constructor(code: string, message: string, data?: unknown) {
    super(message)
    this.code = code
    this.data = data
  }
}

export function errorEnvelope(command: string, error: unknown): Envelope {
  const message = error instanceof Error ? error.message : String(error)
  const code = error instanceof CliError ? error.code : isParseArgsError(error) ? 'usage' : 'failed'
  const data = error instanceof CliError ? error.data : undefined

  return data === undefined
    ? { ok: false, command, error: { code, message } }
    : { ok: false, command, error: { code, message }, data }
}

function isParseArgsError(error: unknown): boolean {
  const code = (error as { code?: unknown } | undefined)?.code

  return typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS_')
}

export function writeEnvelope(envelope: Envelope): void {
  process.stdout.write(`${JSON.stringify(envelope)}\n`)
}
