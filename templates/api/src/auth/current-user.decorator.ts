import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { AuthUser } from './auth.factory'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => {
    return context.switchToHttp().getRequest<Request>().user
  },
)
