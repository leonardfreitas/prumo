import { MikroOrmModule } from '@mikro-orm/nestjs'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { AuthModule } from '@/auth/auth.module'
import { Env } from '@/config/env'
import { EnvModule } from '@/config/env.module'
import { ProblemDetailsFilter } from '@/errors/problem-details.filter'
import { HealthModule } from '@/health/health.module'
import { createOrmConfig } from '@/mikro-orm.factory'
import { RequestContextModule } from '@/request-context/request-context.module'
import { RequestIdMiddleware } from '@/request-context/request-id.middleware'
import { UsersModule } from '@/users/users.module'

@Module({
  imports: [
    EnvModule,
    LoggerModule.forRootAsync({
      inject: [Env],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
          autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') === true },
        },
      }),
    }),
    MikroOrmModule.forRootAsync({
      inject: [Env],
      driver: PostgreSqlDriver,
      useFactory: (env: Env) => createOrmConfig(env),
    }),
    RequestContextModule,
    AuthModule,
    HealthModule,
    UsersModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path')
  }
}
