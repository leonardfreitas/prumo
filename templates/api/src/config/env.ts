import 'reflect-metadata'
import { existsSync } from 'node:fs'
import { plainToInstance } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator'

export type NodeEnv = 'development' | 'test' | 'production'
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export class Env {
  @IsEnum(['development', 'test', 'production'])
  NODE_ENV: NodeEnv

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number

  @IsString()
  @MinLength(1)
  DATABASE_URL: string

  @IsString()
  @MinLength(1)
  AUTH_DATABASE_URL: string

  @IsString()
  @MinLength(32)
  BETTER_AUTH_SECRET: string

  @IsString()
  @MinLength(1)
  BETTER_AUTH_URL: string

  @IsString()
  @MinLength(1)
  WEB_ORIGIN: string

  @IsOptional()
  @Matches(/^[a-z][a-z0-9+.-]*$/)
  MOBILE_APP_SCHEME?: string

  @IsEnum(['error', 'warn', 'info', 'debug'])
  LOG_LEVEL: LogLevel
}

export function validate(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { enableImplicitConversion: true })
  const errors = validateSync(env, { whitelist: true, forbidUnknownValues: false })

  if (errors.length > 0) {
    const named = errors.map((error) => error.property).join(', ')
    throw new Error(`Invalid environment: ${named}`)
  }

  loaded = env
  return env
}

let loaded: Env | undefined

export function loadEnv(): Env {
  if (loaded !== undefined) {
    return loaded
  }

  if (process.env.NODE_ENV !== 'production' && existsSync('.env')) {
    process.loadEnvFile('.env')
  }

  return validate(process.env)
}
