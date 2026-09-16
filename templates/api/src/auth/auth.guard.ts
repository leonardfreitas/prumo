import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { fromNodeHeaders } from 'better-auth/node'
import type { Request } from 'express'
import { AUTH, IS_PUBLIC } from './auth.constants'
import type { Auth } from './auth.factory'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(request.headers) })

    request.user = session?.user
    request.session = session?.session

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic === true) {
      return true
    }

    if (session === null) {
      throw new UnauthorizedException()
    }

    return true
  }
}
