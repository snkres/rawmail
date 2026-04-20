import type { FastifyPluginAsync } from 'fastify'
import { OrgService } from '../services/org.service'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; orgId?: string | null; role?: string }
  }
}

interface OrgRoutesOpts {
  orgService?: OrgService
}

export const orgRoutes: FastifyPluginAsync<OrgRoutesOpts> = async (app, opts) => {
  const orgService = opts.orgService ?? new OrgService(app.db)

  app.addHook('preHandler', async (req, reply) => {
    if (!app.auth) return
    const session = await app.auth.api.getSession({ headers: req.headers as any } as any)
    if (!session) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    req.user = {
      id: session.user.id,
      orgId: (session.user as any).orgId,
      role: (session.user as any).role,
    }
  })

  app.post<{ Body: { name: string; slug: string } }>('/', async (req, reply) => {
    const org = await orgService.create({ ...req.body, ownerId: req.user!.id })
    return reply.code(201).send(org)
  })

  app.get<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
    const org = await orgService.getBySlug(req.params.slug)
    if (!org) return reply.code(404).send({ error: 'Not found' })
    return org
  })

  app.patch<{ Params: { slug: string }; Body: { name?: string; ssoDomain?: string } }>(
    '/:slug',
    async (req) => orgService.update(req.params.slug, req.body),
  )

  app.get<{ Params: { slug: string } }>('/:slug/inboxes', async (req) => {
    return orgService.listInboxes(req.params.slug)
  })

  app.post<{ Params: { slug: string }; Body: { address: string } }>(
    '/:slug/inboxes',
    async (req, reply) => {
      const inbox = await orgService.createInbox(req.params.slug, req.body.address)
      return reply.code(201).send(inbox)
    },
  )

  app.get<{ Params: { slug: string } }>('/:slug/members', async (req) => {
    return orgService.listMembers(req.params.slug)
  })

  app.patch<{ Params: { slug: string; memberId: string }; Body: { role: string } }>(
    '/:slug/members/:memberId',
    async (req) => orgService.updateMemberRole(req.params.memberId, req.body.role),
  )

  app.delete<{ Params: { slug: string; memberId: string } }>(
    '/:slug/members/:memberId',
    async (req, reply) => {
      await orgService.removeMember(req.params.slug, req.params.memberId)
      return reply.code(204).send()
    },
  )
}
