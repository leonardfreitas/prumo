import { MikroORM } from '@mikro-orm/postgresql'
import { getMigrations } from 'better-auth/db/migration'
import { Client, type Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, inject } from 'vitest'
import { createAuth } from '../src/auth/auth.factory'
import { createOrmConfig } from '../src/mikro-orm.factory'

let orm: MikroORM
let databaseUrl: string
let tables: string[] = []

export function testOrm(): MikroORM {
  return orm
}

export function testDatabaseUrl(): string {
  return databaseUrl
}

async function createWorkerDatabase(baseUrl: string, name: string): Promise<string> {
  const admin = new Client({ connectionString: baseUrl })

  await admin.connect()
  await admin.query(`DROP DATABASE IF EXISTS "${name}"`)
  await admin.query(`CREATE DATABASE "${name}"`)
  await admin.end()

  const url = new URL(baseUrl)
  url.pathname = `/${name}`

  const worker = new Client({ connectionString: url.toString() })

  await worker.connect()
  await worker.query('CREATE SCHEMA IF NOT EXISTS auth')
  await worker.end()

  return url.toString()
}

async function migrateAuth(databaseUrl: string): Promise<void> {
  const auth = createAuth({
    AUTH_DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost',
    WEB_ORIGIN: 'http://localhost:5173',
  })
  const { runMigrations } = await getMigrations(auth.options)

  await runMigrations()
  await (auth.options.database as Pool).end()
}

beforeAll(async () => {
  const name = `test_${process.env.VITEST_WORKER_ID ?? '1'}`
  const clientUrl = await createWorkerDatabase(inject('postgresUrl'), name)

  databaseUrl = clientUrl
  await migrateAuth(clientUrl)

  orm = await MikroORM.init(createOrmConfig({ DATABASE_URL: clientUrl, NODE_ENV: 'test' }))

  await orm.migrator.up()

  const metadata = orm.getMetadata().getAll()
  const own = Object.values(metadata)
    .filter((meta) => meta.tableName !== undefined && meta.pivotTable !== true)
    .map((meta) => `"${meta.tableName}"`)

  tables = [...own, 'auth."user"', 'auth.session', 'auth.account', 'auth.verification']
})

beforeEach(async () => {
  if (tables.length > 0) {
    await orm.em.getConnection().execute(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`)
  }
})

afterAll(async () => {
  await orm.close()
})
