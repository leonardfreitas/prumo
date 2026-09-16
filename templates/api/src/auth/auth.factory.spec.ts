import { describe, expect, it } from 'vitest'
import { testDatabaseUrl } from '../../test/setup'
import { createAuth } from './auth.factory'

const env = () => ({
  AUTH_DATABASE_URL: testDatabaseUrl(),
  BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters',
  BETTER_AUTH_URL: 'http://localhost:3000',
  WEB_ORIGIN: 'http://localhost:5173',
})

const proxy =
  'http://localhost:3000/api/auth/expo-authorization-proxy?authorizationURL=https://example.com/authorize&oauthState=s'

describe('createAuth', () => {
  it('exposes no Expo redirect endpoint without a mobile scheme', async () => {
    const response = await createAuth(env()).handler(new Request(proxy))

    expect(response.status).toBe(404)
  })

  it('exposes the Expo endpoint and trusts the scheme once a mobile scheme is set', async () => {
    const auth = createAuth({ ...env(), MOBILE_APP_SCHEME: 'app' })
    const response = await auth.handler(new Request(proxy))

    expect(response.status).toBe(302)
    expect(auth.options.trustedOrigins).toContain('app://')
  })
})
