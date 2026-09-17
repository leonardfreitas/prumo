import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import type { AuthClient } from './auth-client'

export function SignOutButton({ auth }: { auth: AuthClient }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function signOut() {
    try {
      await auth.signOut()
    } catch {
      // Better Auth throws when the request never arrives. The cache is cleared regardless, because data left behind
      // for the next person on this tab is the worse error; the cookie survives until the server's session expires.
    }

    // The whole cache, not only the session: a query about "me" belongs to whoever was signed in.
    queryClient.clear()
    await navigate({ to: '/sign-in' })
  }

  return (
    <Button type="button" variant="outline" onClick={signOut}>
      Sign out
    </Button>
  )
}
