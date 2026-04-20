import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { domainRoutes } from '../src/routes/domains'

function buildTestApp(allowTeams = true) {
  const app = Fastify({ logger: false })
  const mockDomainService = {
    add: vi.fn(async (_orgId: string, domain: string) => ({ id: 'dom-1', domain })),
    verify: vi.fn(async () => ({ verified: true, addresses: [] })),
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

  app.register(domainRoutes, {
    prefix: '/v1/orgs',
    domainService: mockDomainService as any,
    orgService: mockOrgService as any,
  })

  return { app, mockDomainService }
}

describe('domainRoutes', () => {
  it('creates a custom domain', async () => {
    const { app } = buildTestApp(true)
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orgs/acme/domains',
      payload: { domain: 'tmp.acme.com' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().instructions).toContain('MX')
  })

  it('verifies a custom domain', async () => {
    const { app, mockDomainService } = buildTestApp(true)
    const res = await app.inject({ method: 'GET', url: '/v1/orgs/acme/domains/dom-1/verify' })
    expect(res.statusCode).toBe(200)
    expect(mockDomainService.verify).toHaveBeenCalledWith('dom-1')
  })
})
