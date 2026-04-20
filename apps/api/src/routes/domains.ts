import type { FastifyPluginAsync } from 'fastify'
import { DomainService } from '../services/domain.service'
import { OrgService } from '../services/org.service'

interface DomainRoutesOpts {
  domainService?: DomainService
  orgService?: OrgService
}

export const domainRoutes: FastifyPluginAsync<DomainRoutesOpts> = async (app, opts) => {
  const domainService = opts.domainService ?? new DomainService(app.db)
  const orgService = opts.orgService ?? new OrgService(app.db)

  app.addHook('preHandler', async (req) => {
    if (!app.auth) return
    const session = await app.auth.api.getSession({ headers: req.headers as any } as any)
    if (session) {
      ;(req as any).user = {
        id: session.user.id,
        orgId: (session.user as any).orgId,
        role: (session.user as any).role,
      }
    }
  })

  app.post<{ Params: { slug: string }; Body: { domain: string } }>(
    '/:slug/domains',
    { preHandler: [app.requireTeams] },
    async (req, reply) => {
      const org = await orgService.getBySlug(req.params.slug)
      if (!org) return reply.code(404).send({ error: 'Org not found' })
      const d = await domainService.add(org.id, req.body.domain)
      return reply.code(201).send({
        ...d,
        instructions: `Add MX record: ${req.body.domain} MX 10 ${process.env.MX_TARGET ?? 'mx.rawmail.sh'}`,
      })
    },
  )

  app.get<{ Params: { slug: string; id: string } }>(
    '/:slug/domains/:id/verify',
    { preHandler: [app.requireTeams] },
    async (req) => domainService.verify(req.params.id),
  )
}
