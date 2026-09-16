import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Env, loadEnv } from './env'

@Global()
@Module({
  imports: [ConfigModule.forRoot({ cache: true, ignoreEnvFile: true, validate: loadEnv })],
  providers: [{ provide: Env, useFactory: loadEnv }],
  exports: [Env],
})
export class EnvModule {}
