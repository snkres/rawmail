import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { messageRoutes } from '../src/routes/messages'

function buildTestApp() {
  const app = Fastify({ logger: false })
  const mockService = {
    getById: vi.fn(async (id: string): Promise<any> => ({
      id,
      inboxId: 'inbox-1',
      subject: 'Test',
      htmlBody: '<p>hi</p>',
      textBody: 'hi',
      fromAddress: 'a@b.com',
      receivedAt: new Date().toISOString(),
    })),
    delete: vi.fn(async () => {}),
  }
  app.decorate('db', {} as any)
  app.register(messageRoutes, {
    prefix: '/v1/messages',
    messageService: mockService as any,
  })
  return { app, mockService }
}

describe('GET /v1/messages/:id', () => {
  it('returns message', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/v1/messages/msg-1' })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe('msg-1')
  })

  it('returns 404 when not found', async () => {
    const { app, mockService } = buildTestApp()
    mockService.getById.mockResolvedValue(null)
    const res = await app.inject({ method: 'GET', url: '/v1/messages/missing' })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /v1/messages/:id', () => {
  it('returns 204', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'DELETE', url: '/v1/messages/msg-1' })
    expect(res.statusCode).toBe(204)
  })
})
