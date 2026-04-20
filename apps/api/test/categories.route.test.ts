import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { categoryRoutes } from '../src/routes/categories'

function buildTestApp(allowTeams = true) {
  const app = Fastify({ logger: false })
  const mockCategoryService = {
    list: vi.fn(async () => []),
    create: vi.fn(async (_orgId: string, name: string) => ({ id: 'cat-1', name })),
    update: vi.fn(async (_id: string, body: any) => ({ id: 'cat-1', ...body })),
    delete: vi.fn(async () => {}),
  }
  const mockOrgService = {
    getBySlug: vi.fn(async (slug: string) => ({ id: 'org-1', slug })),
  }

  app.decorate('db', {} as any)
  app.decorate('auth', {
    api: {
      getSession: vi.fn(async () => ({ user: { id: 'u-1', orgId: 'org-1', role: 'owner' } })),
    },
  } as any)
  app.decorate('requireTeams', vi.fn(async (_req: any, reply: any) => {
    if (!allowTeams) return reply.code(403).send({ error: 'Teams plan required' })
  }))

  app.register(categoryRoutes, {
    prefix: '/v1/orgs',
    categoryService: mockCategoryService as any,
    orgService: mockOrgService as any,
  })

  return { app, mockCategoryService }
}

describe('categoryRoutes', () => {
  it('returns 403 when teams plan is missing', async () => {
    const { app } = buildTestApp(false)
    const res = await app.inject({ method: 'GET', url: '/v1/orgs/acme/categories' })
    expect(res.statusCode).toBe(403)
  })

  it('creates category when teams plan is valid', async () => {
    const { app, mockCategoryService } = buildTestApp(true)
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orgs/acme/categories',
      payload: { name: 'Billing' },
    })
    expect(res.statusCode).toBe(201)
    expect(mockCategoryService.create).toHaveBeenCalled()
  })
})
