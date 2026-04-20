import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { orgRoutes } from '../src/routes/orgs'

function buildTestApp(authorized = true) {
  const app = Fastify({ logger: false })
  const mockOrgService = {
    create: vi.fn(async ({ name, slug, ownerId }: any) => ({ id: 'org-1', name, slug, ownerId })),
    getBySlug: vi.fn(async (slug: string) => ({ id: 'org-1', slug, name: 'Acme' })),
    update: vi.fn(async (_slug: string, body: any) => ({ id: 'org-1', ...body })),
    listInboxes: vi.fn(async () => []),
    createInbox: vi.fn(async (_slug: string, address: string) => ({ id: 'inbox-1', address })),
    listMembers: vi.fn(async () => [{ id: 'u-1', role: 'owner' }]),
    updateMemberRole: vi.fn(async () => {}),
    removeMember: vi.fn(async () => {}),
  }

  app.decorate('db', {} as any)
  app.decorate('auth', {
    api: {
      getSession: vi.fn(async () =>
        authorized ? { user: { id: 'u-1', orgId: 'org-1', role: 'owner' } } : null,
      ),
    },
  } as any)

  app.register(orgRoutes, { prefix: '/v1/orgs', orgService: mockOrgService as any })
  return { app, mockOrgService }
}

describe('orgRoutes', () => {
  it('returns 401 when session is missing', async () => {
    const { app } = buildTestApp(false)
    const res = await app.inject({ method: 'GET', url: '/v1/orgs/acme' })
    expect(res.statusCode).toBe(401)
  })

  it('creates org when authorized', async () => {
    const { app, mockOrgService } = buildTestApp(true)
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orgs',
      payload: { name: 'Acme', slug: 'acme' },
    })
    expect(res.statusCode).toBe(201)
    expect(mockOrgService.create).toHaveBeenCalled()
  })

  it('lists org members', async () => {
    const { app } = buildTestApp(true)
    const res = await app.inject({ method: 'GET', url: '/v1/orgs/acme/members' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
  })
})
