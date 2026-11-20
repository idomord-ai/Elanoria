import { describe, expect, it } from 'vitest'
import { publicError, publicSession } from './character-pdf-plugin.ts'

describe('character PDF connection feedback', () => {
  it('distinguishes a reachable helper from a pending sign-in', () => {
    expect(publicSession({ status: 'disconnected', sharing: false })).toMatchObject({ connected: false, connecting: false })
    expect(publicSession({ status: 'connecting', sharing: false })).toMatchObject({ connected: false, connecting: true })
  })

  it('explains when sign-in succeeded with plan usage still disabled', () => {
    expect(publicSession({ status: 'connected', sharing: false, profileLabel: 'Test account' })).toMatchObject({
      connected: false,
      accountLabel: undefined,
      error: expect.stringContaining('allow plan usage'),
    })
  })

  it('keeps the helpful error from a failed sign-in in the status response', () => {
    const session = publicSession({ status: 'disconnected', sharing: false, error: { code: 'network_error' } })
    expect(session.error).toContain('could not reach ChatGPT')
    expect(publicError({ code: 'subscription_sharing_user_not_eligible' })).toMatchObject({
      status: 403,
      message: expect.stringContaining('selected account or workspace'),
    })
  })

  it('does not expose arbitrary provider error text', () => {
    const error = publicError({ code: 'unexpected_error', message: 'Untrusted provider text' })
    expect(error.status).toBe(502)
    expect(error.message).not.toContain('Untrusted provider text')
  })
})
