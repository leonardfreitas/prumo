import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'
import type { ApiClient } from '@/api-contract'
import type { AuthClient } from '@/features/auth/auth-client'
import { routeTree } from './routeTree.gen'

export type RouterContext = {
  queryClient: QueryClient
  api: ApiClient
  auth: AuthClient
}

export function createAppRouter(context: RouterContext, history?: RouterHistory) {
  return createRouter({ routeTree, context, history, defaultPreload: 'intent' })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
