import { All, Controller, Inject, Req, Res, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { toNodeHandler } from 'better-auth/node'
import type { Request, Response } from 'express'
import { AUTH } from './auth.constants'
import type { Auth } from './auth.factory'
import { Public } from './public.decorator'

@ApiExcludeController()
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  @Public()
  @All('*path')
  handle(@Req() request: Request, @Res() response: Response): Promise<void> {
    return toNodeHandler(this.auth)(request, response)
  }
}
