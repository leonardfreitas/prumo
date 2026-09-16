import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { AuthUser } from '@/auth/auth.factory'
import { CurrentUser } from '@/auth/current-user.decorator'
import { UpdateProfileDto } from './dto/update-profile.dto'
import type { Profile } from './entities/profile.entity'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthUser): Promise<Profile> {
    return this.users.findProfile(user.id)
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() changes: UpdateProfileDto): Promise<Profile> {
    return this.users.updateProfile(user.id, changes)
  }
}
