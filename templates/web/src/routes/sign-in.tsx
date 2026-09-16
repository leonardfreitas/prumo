import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInForm } from '@/features/auth/sign-in-form'

export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: SignInPage,
})

function SignInPage() {
  const { auth } = Route.useRouteContext()
  const { redirect } = Route.useSearch()

  return (
    <>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <SignInForm auth={auth} redirect={redirect} />
    </>
  )
}
