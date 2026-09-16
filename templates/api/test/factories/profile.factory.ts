import type { EntityManager } from '@mikro-orm/postgresql'
import { Profile } from '@/users/entities/profile.entity'
import { createUser } from './user.factory'

type ProfileOverrides = Partial<{
  userId: string
  displayName: string
  locale: string
  timezone: string
}>

export async function createProfile(
  em: EntityManager,
  overrides: ProfileOverrides = {},
): Promise<Profile> {
  const profile = em.create(Profile, {
    userId: overrides.userId ?? (await createUser(em)),
    displayName: overrides.displayName ?? 'Test Person',
    locale: overrides.locale ?? 'en',
    timezone: overrides.timezone ?? 'UTC',
  })

  await em.flush()

  return profile
}
