import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Profile } from '@/api-contract'
import { fakeTransport, json } from '../test/fake-transport'
import { renderApp } from '../test/render-app'

const user = { id: 'user-1', email: 'ana@example.com', name: 'Ana' }

const session = { session: { id: 'session-1', userId: user.id }, user }

const profile: Profile = {
  id: 'profile-1',
  userId: user.id,
  displayName: 'Ana',
  locale: 'en',
  timezone: 'UTC',
  createdAt: '2026-09-14T12:57:24.057Z',
  updatedAt: '2026-09-14T12:57:24.057Z',
}

describe('App', () => {
  it('sends a visitor without a session to sign in', async () => {
    renderApp('/', fakeTransport({ 'GET /api/auth/get-session': () => json(200, null) }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  // The protected route reads the session through ensureQueryData, which keeps a cached null. Found in a real browser:
  // signing in succeeded, a session existed, and the visitor was sent straight back to sign in.
  it('takes a visitor who signs in to the page they were turned away from', async () => {
    const visitor = userEvent.setup()
    let signedIn = false

    renderApp(
      '/',
      fakeTransport({
        'GET /api/auth/get-session': () => json(200, signedIn ? session : null),
        'POST /api/auth/sign-in/email': () => {
          signedIn = true
          return json(200, { redirect: false, token: 'token-1', user })
        },
        'GET /api/v1/users/me': () => json(200, profile),
      }),
    )

    await visitor.type(await screen.findByLabelText('Email'), user.email)
    await visitor.type(screen.getByLabelText('Password'), 'correct-horse-battery')
    await visitor.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeInTheDocument()
  })

  // Starting from sign-up would hide the defect: only a protected route caches the null session first.
  it('takes a visitor turned away to sign in, who then creates an account, into the app', async () => {
    const visitor = userEvent.setup()
    let registered = false

    renderApp(
      '/',
      fakeTransport({
        'GET /api/auth/get-session': () => json(200, registered ? session : null),
        'POST /api/auth/sign-up/email': () => {
          registered = true
          return json(200, { token: 'token-1', user })
        },
        'GET /api/v1/users/me': () => json(200, profile),
      }),
    )

    await visitor.click(await screen.findByRole('link', { name: 'Sign up' }))
    await visitor.type(await screen.findByLabelText('Name'), user.name)
    await visitor.type(screen.getByLabelText('Email'), user.email)
    await visitor.type(screen.getByLabelText('Password'), 'correct-horse-battery')
    await visitor.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeInTheDocument()
  })
})
