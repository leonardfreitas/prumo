import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

const LOCALES = ['en', 'pt-BR'] as const

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string

  @IsOptional()
  @IsIn(LOCALES)
  locale?: (typeof LOCALES)[number]

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string
}
