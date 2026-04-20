import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { streamRoutes } from '../src/routes/stream'

function buildTestApp(isClaimed = false, tokenValid = true) {
  const app = Fastify({ logger: false })

  const mockInboxService = {
    getOrCreate: vi.fn(async (addr: string) => ({
      id: 'inbox-1',
      address: addr,
      isClaimed,
    })),
    verifyToken: vi.fn(async () => tokenValid),
  }

  const mockRedis = {
    duplicate: vi.fn(() => ({
      subscribe: vi.fn(async () => {}),
      on: vi.fn(),
      quit: vi.fn(async () => {}),
    })),
  }

  app.decorate('db', {} as any)
  app.decorate('redis', mockRedis as any)
  app.register(streamRoutes, {
    prefix: '/v1/inboxes',
    inboxService: mockInboxService as any,
  })
  return { app, mockInboxService }
}

describe('GET /v1/inboxes/:address/stream', () => {
  it('opens SSE stream for anonymous inbox', async () => {
    const { app } = buildTestApp(false)
    const res = await app.inject({
      method: 'GET',
      url: '/v1/inboxes/test@rawmail.sh/stream',
    })
    expect(res.headers['content-type']).toContain('text/event-stream')
  })

  it('returns 401 for claimed inbox without token', async () => {
    const { app } = buildTestApp(true, false)
    const res = await app.inject({
      method: 'GET',
      url: '/v1/inboxes/test@rawmail.sh/stream',
    })
    expect(res.statusCode).toBe(401)
  })

  it('opens stream for claimed inbox with valid token', async () => {
    const { app } = buildTestApp(true, true)
    const res = await app.inject({
      method: 'GET',
      url: '/v1/inboxes/test@rawmail.sh/stream',
      headers: { 'x-inbox-token': 'valid-token' },
    })
    expect(res.headers['content-type']).toContain('text/event-stream')
  })
})
