import { BadRequestException, type ValidationError } from '@nestjs/common'

export type FieldErrors = Record<string, string[]>

function collect(errors: ValidationError[], prefix: string, into: FieldErrors): void {
  for (const error of errors) {
    const key = prefix === '' ? error.property : `${prefix}.${error.property}`
    const messages = Object.values(error.constraints ?? {})

    if (messages.length > 0) {
      into[key] = messages
    }

    if (error.children !== undefined && error.children.length > 0) {
      collect(error.children, key, into)
    }
  }
}

export class ValidationFailedException extends BadRequestException {
  constructor(readonly fields: FieldErrors) {
    super('Validation failed')
  }
}

export function validationExceptionFactory(errors: ValidationError[]): ValidationFailedException {
  const fields: FieldErrors = {}
  collect(errors, '', fields)
  return new ValidationFailedException(fields)
}
