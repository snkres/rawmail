import { describe, it, expect } from 'vitest'
import { RawmailClient } from '../src/client'

describe('RawmailClient', () => {
  it('constructs with defaults', () => {
    const client = new RawmailClient()
    expect(client.inboxes).toBeDefined()
  })

  it('constructs with custom baseUrl', () => {
    const client = new RawmailClient({ baseUrl: 'http://localhost:3001' })
    expect(client.inboxes).toBeDefined()
  })
})
