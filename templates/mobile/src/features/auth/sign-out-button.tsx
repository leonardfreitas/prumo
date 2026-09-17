import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { clearUserData } from '@/features/storage/storage'
import type { AuthClient } from './auth-client'

export type SignOutAuth = Pick<AuthClient, 'signOut'>

export function SignOutButton({
  auth,
  onSignedOut,
}: {
  auth: SignOutAuth
  onSignedOut: () => void
}) {
  const queryClient = useQueryClient()

  async function signOut() {
    try {
      await auth.signOut()
    } catch {
      // A failed request leaves nothing on the device to act on: the Expo plugin deletes the stored cookie before it
      // sends. The server's session outlives it until it expires, and signing out locally is still what was asked.
    }

    // What the plugin cannot know is the rest of this user's data: the query cache and every user-scoped key, or the
    // next person on this device reads them.
    queryClient.clear()
    clearUserData()
    onSignedOut()
  }

  return <Button label="Sign out" variant="outline" onPress={signOut} />
}
