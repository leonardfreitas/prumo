import { useQuery } from '@tanstack/react-query'
import { Redirect, Stack, usePathname } from 'expo-router'
import { rememberIntendedRoute } from '@/features/auth/intended-route'
import { sessionQuery } from '@/features/auth/session'
import { useClients } from '@/features/clients/clients-context'

export default function AuthenticatedLayout() {
  const { auth } = useClients()
  const session = useQuery(sessionQuery(auth))
  const pathname = usePathname()

  if (session.data === null || session.data === undefined) {
    rememberIntendedRoute(pathname)
    return <Redirect href="/sign-in" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
