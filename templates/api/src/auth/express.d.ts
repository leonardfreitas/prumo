import type { AuthSession, AuthUser } from './auth.factory'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      session?: NonNullable<AuthSession>['session']
    }
  }
}
