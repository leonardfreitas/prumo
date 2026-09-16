import { EntityManager } from '@mikro-orm/postgresql'
import { Injectable, NotFoundException } from '@nestjs/common'
import type { UpdateProfileDto } from './dto/update-profile.dto'
import { Profile } from './entities/profile.entity'

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findProfile(userId: string): Promise<Profile> {
    const profile = await this.em.findOne(Profile, { userId })

    if (profile === null) {
      throw new NotFoundException('Profile not found')
    }

    return profile
  }

  async updateProfile(userId: string, changes: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findProfile(userId)

    this.em.assign(profile, changes, { ignoreUndefined: true })
    await this.em.flush()

    return profile
  }

  async createProfile(userId: string, displayName: string): Promise<Profile> {
    const profile = this.em.create(Profile, { userId, displayName })

    await this.em.flush()

    return profile
  }
}
