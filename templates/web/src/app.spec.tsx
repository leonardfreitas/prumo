import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fakeTransport, json } from '../test/fake-transport'
import { renderApp } from '../test/render-app'

describe('App', () => {
  it('sends a visitor without a session to sign in', async () => {
    renderApp('/', fakeTransport({ 'GET /api/auth/get-session': () => json(200, null) }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
