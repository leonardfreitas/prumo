import { randomUUID } from 'node:crypto'
import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { RequestContextService } from './request-context.service'

export const REQUEST_ID_HEADER = 'x-request-id'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const inbound = request.header(REQUEST_ID_HEADER)
    const requestId = inbound && inbound.length > 0 ? inbound : randomUUID()

    response.setHeader(REQUEST_ID_HEADER, requestId)
    this.context.run(requestId, next)
  }
}
