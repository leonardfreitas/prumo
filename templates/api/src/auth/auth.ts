import { loadEnv } from '@/config/env'
import { createAuth } from './auth.factory'

export const auth = createAuth(loadEnv())
