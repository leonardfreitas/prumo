import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Env } from '@/config/env'
import { UsersModule } from '@/users/users.module'
import { UsersService } from '@/users/users.service'
import { AUTH } from './auth.constants'
import { AuthController } from './auth.controller'
import { createAuth } from './auth.factory'
import { AuthGuard } from './auth.guard'

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH,
      inject: [Env, UsersService],
      useFactory: (env: Env, users: UsersService) =>
        createAuth(env, {
          onUserCreated: async (user) => {
            await users.createProfile(user.id, user.name)
          },
        }),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class AuthModule {}
