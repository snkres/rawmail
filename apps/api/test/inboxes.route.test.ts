import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { inboxRoutes } from '../src/routes/inboxes'

function buildTestApp() {
  const app = Fastify({ logger: false })

  const mockInboxService = {
    getOrCreate: vi.fn(async (addr: string) => ({
      id: 'inbox-1',
      address: addr,
      isClaimed: false,
      ttlExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
      createdAt: new Date().toISOString(),
    })),
    claim: vi.fn(async () => ({
      token: 'a'.repeat(64),
      inbox: { id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: true },
    })),
    verifyToken: vi.fn(async () => true),
    delete: vi.fn(async () => {}),
    extendTtl: vi.fn(async (addr: string) => ({
      id: 'inbox-1',
      address: addr,
      ttlExpiresAt: new Date().toISOString(),
    })),
  }

  app.decorate('db', {} as any)
  app.decorate('redis', {} as any)

  app.register(inboxRoutes, {
    prefix: '/v1/inboxes',
    inboxService: mockInboxService as any,
  })

  return { app, mockInboxService }
}

describe('GET /v1/inboxes/:address', () => {
  it('returns inbox', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/v1/inboxes/test@rawmail.sh' })
    expect(res.statusCode).toBe(200)
    expect(res.json().address).toBe('test@rawmail.sh')
  })
})

describe('POST /v1/inboxes/:address/claim', () => {
  it('returns token', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/v1/inboxes/test@rawmail.sh/claim',
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().token).toHaveLength(64)
  })
})

describe('DELETE /v1/inboxes/:address', () => {
  it('returns 401 without token', async () => {
    const { app, mockInboxService } = buildTestApp()
    mockInboxService.verifyToken.mockResolvedValue(false)
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/inboxes/test@rawmail.sh',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 204 with valid token', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/inboxes/test@rawmail.sh',
      headers: { 'x-inbox-token': 'valid-token' },
    })
    expect(res.statusCode).toBe(204)
  })
})
