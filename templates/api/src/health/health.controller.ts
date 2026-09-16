import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  MikroOrmHealthIndicator,
} from '@nestjs/terminus'
import { Public } from '@/auth/public.decorator'

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: MikroOrmHealthIndicator,
  ) {}

  @Public()
  @Get('live')
  @HealthCheck()
  live(): Promise<HealthCheckResult> {
    return this.health.check([])
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck('database')])
  }
}
