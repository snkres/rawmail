import type { FastifyPluginAsync } from 'fastify'

export const setupRoutes: FastifyPluginAsync = async (app) => {
  app.get('/status', async () => {
    const firstOrg = await app.db.query.orgs.findFirst()
    return { setupComplete: !!firstOrg }
  })
}
