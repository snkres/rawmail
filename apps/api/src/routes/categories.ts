import type { FastifyPluginAsync } from 'fastify'
import { CategoryService } from '../services/category.service'
import { OrgService } from '../services/org.service'

interface CategoryRoutesOpts {
  categoryService?: CategoryService
  orgService?: OrgService
}

export const categoryRoutes: FastifyPluginAsync<CategoryRoutesOpts> = async (app, opts) => {
  const categoryService = opts.categoryService ?? new CategoryService(app.db)
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

  app.get<{ Params: { slug: string } }>(
    '/:slug/categories',
    { preHandler: [app.requireTeams] },
    async (req, reply) => {
      const org = await orgService.getBySlug(req.params.slug)
      if (!org) return reply.code(404).send({ error: 'Org not found' })
      return categoryService.list(org.id)
    },
  )

  app.post<{ Params: { slug: string }; Body: { name: string; parentId?: string } }>(
    '/:slug/categories',
    { preHandler: [app.requireTeams] },
    async (req, reply) => {
      const org = await orgService.getBySlug(req.params.slug)
      if (!org) return reply.code(404).send({ error: 'Org not found' })
      const cat = await categoryService.create(org.id, req.body.name, req.body.parentId)
      return reply.code(201).send(cat)
    },
  )

  app.patch<{ Params: { slug: string; id: string }; Body: { name?: string; parentId?: string } }>(
    '/:slug/categories/:id',
    { preHandler: [app.requireTeams] },
    async (req) => categoryService.update(req.params.id, req.body),
  )

  app.delete<{ Params: { slug: string; id: string } }>(
    '/:slug/categories/:id',
    { preHandler: [app.requireTeams] },
    async (req, reply) => {
      await categoryService.delete(req.params.id)
      return reply.code(204).send()
    },
  )
}
