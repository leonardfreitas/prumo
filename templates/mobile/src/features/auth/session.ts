import { queryOptions } from '@tanstack/react-query'
import { ApiError } from '@/api-contract'
import type { SessionAuth } from './auth-client'

export const sessionQuery = (auth: SessionAuth) =>
  queryOptions({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await auth.getSession()

      if (error !== null) {
        throw ApiError.fromAuthError(error)
      }

      return data
    },
  })
