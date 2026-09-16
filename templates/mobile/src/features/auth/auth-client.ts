import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'
import type { Transport } from '@/api-contract'

export type AuthClient = ReturnType<typeof createAuth>

export type SessionAuth = Pick<AuthClient, 'signIn' | 'signUp' | 'getSession'>

export function createAuth({ baseUrl, fetch }: { baseUrl: string; fetch: Transport }) {
  return createAuthClient({
    baseURL: baseUrl,
    basePath: '/api/auth',
    fetchOptions: { customFetchImpl: fetch },
    plugins: [expoClient({ storage: SecureStore })],
  })
}

export function withSessionCookie(auth: AuthClient, fetch: Transport): Transport {
  return async (input, init) => {
    const headers = new Headers(init?.headers)

    headers.set('cookie', await auth.getCookie())

    return fetch(input, { ...init, headers, credentials: 'omit' })
  }
}
