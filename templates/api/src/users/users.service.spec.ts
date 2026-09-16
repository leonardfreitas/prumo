import { NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { beforeEach, describe, expect, it } from 'vitest'
import { createProfile } from '../../test/factories/profile.factory'
import { testOrm } from '../../test/setup'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    service = new UsersService(testOrm().em.fork())
  })

  it('finds the profile belonging to a user', async () => {
    const em = testOrm().em.fork()
    const created = await createProfile(em, { displayName: 'Ana' })

    await expect(service.findProfile(created.userId)).resolves.toMatchObject({
      displayName: 'Ana',
    })
  })

  it('refuses a user without a profile', async () => {
    await expect(service.findProfile(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundException)
  })

  it('applies only the fields the request carries', async () => {
    const em = testOrm().em.fork()
    const created = await createProfile(em, {
      displayName: 'Ana',
      timezone: 'UTC',
    })

    const changes = plainToInstance(UpdateProfileDto, { timezone: 'America/Sao_Paulo' })
    const updated = await service.updateProfile(created.userId, changes)

    expect(updated).toMatchObject({
      displayName: 'Ana',
      timezone: 'America/Sao_Paulo',
    })
  })
})
