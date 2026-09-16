import { createAuthClient } from 'better-auth/react'
import type { Transport } from '@/api-contract'

export type AuthClient = ReturnType<typeof createAuth>

export function createAuth({ baseUrl, fetch }: { baseUrl: string; fetch: Transport }) {
  return createAuthClient({
    baseURL: baseUrl,
    basePath: '/api/auth',
    fetchOptions: { customFetchImpl: fetch },
  })
}
