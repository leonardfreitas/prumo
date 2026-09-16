import '@/index.css'
import { QueryClient } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient, type Transport } from '@/api-contract'
import { createAuth } from '@/features/auth/auth-client'
import { App } from './app'
import { config } from './config'

const transport: Transport = (input, init) => fetch(input, { ...init, credentials: 'include' })

const context = {
  queryClient: new QueryClient(),
  api: createClient({ baseUrl: config.VITE_API_URL, fetch: transport }),
  auth: createAuth({ baseUrl: config.VITE_API_URL, fetch: transport }),
}

const root = document.getElementById('root')

if (root === null) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <App context={context} />
  </StrictMode>,
)
