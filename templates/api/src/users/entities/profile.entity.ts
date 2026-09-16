import { defineEntity, p } from '@mikro-orm/core'

const ProfileSchema = defineEntity({
  name: 'Profile',
  properties: {
    id: p.uuid().primary().defaultRaw('uuidv7()'),
    userId: p.uuid().unique(),
    displayName: p.text(),
    locale: p.text().default('en'),
    timezone: p.text().default('UTC'),
    createdAt: p
      .datetime()
      .onCreate(() => new Date())
      .defaultRaw('now()'),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date())
      .defaultRaw('now()'),
  },
})

export class Profile extends ProfileSchema.class {}

ProfileSchema.setClass(Profile)

export { ProfileSchema }
