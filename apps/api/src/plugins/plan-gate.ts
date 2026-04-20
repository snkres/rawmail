import fp from 'fastify-plugin'
import { eq } from 'drizzle-orm'
import { orgs } from '@rawmail/db'

declare module 'fastify' {
  interface FastifyInstance {
    requireTeams: (req: any, reply: any) => Promise<void>
  }
}

export const planGatePlugin = fp(async (app) => {
  app.decorate('requireTeams', async (req: any, reply: any) => {
    if (!req.user?.orgId) {
      reply.code(403).send({ error: 'Teams plan required' })
      return
    }
    const org = await app.db.query.orgs.findFirst({ where: eq(orgs.id, req.user.orgId) })
    if (org?.plan !== 'teams') {
      reply.code(403).send({ error: 'Teams plan required' })
      return
    }
  })
})
