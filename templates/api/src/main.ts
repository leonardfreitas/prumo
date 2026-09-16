import { MikroORM } from '@mikro-orm/postgresql'
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { Env } from './config/env'
import { validationExceptionFactory } from './errors/validation-exception.factory'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const env = app.get(Env)

  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true, exposedHeaders: ['X-Request-Id'] })
  app.enableVersioning({ type: VersioningType.URI })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  )
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  if (env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('API').setVersion('1').build(),
    )
    SwaggerModule.setup('api/docs', app, document)
  }

  // MikroORM 7 no longer connects on init, so readiness would report the database down until a first query.
  await app.get(MikroORM).connect()

  await app.listen(env.PORT)
}

void bootstrap()
