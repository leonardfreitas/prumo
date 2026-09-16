import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { RequestContextService } from '@/request-context/request-context.service'
import { ValidationFailedException } from './validation-exception.factory'

type ProblemDocument = {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  requestId?: string
  errors?: Record<string, string[]>
}

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
}

function detailOf(exception: HttpException): string {
  const response = exception.getResponse()

  if (typeof response === 'string') {
    return response
  }

  const message = (response as { message?: unknown }).message

  if (typeof message === 'string') {
    return message
  }

  return exception.message
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name)

  constructor(private readonly context: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const problem: ProblemDocument = {
      type: 'about:blank',
      title: TITLES[status] ?? 'Error',
      status,
      detail:
        exception instanceof HttpException && status < HttpStatus.INTERNAL_SERVER_ERROR
          ? detailOf(exception)
          : 'An unexpected error occurred.',
      instance: request.originalUrl,
      requestId: this.context.requestId,
    }

    if (exception instanceof ValidationFailedException) {
      problem.errors = exception.fields
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception)
    }

    response.status(status).type('application/problem+json').json(problem)
  }
}
