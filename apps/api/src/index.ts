import Fastify, { type FastifyServerOptions } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import rawBody from 'fastify-raw-body'
import { createAuth } from '@rawmail/auth'
import { dbPlugin } from './plugins/db'
import { redisPlugin } from './plugins/redis'
import { rateLimitPlugin } from './plugins/rate-limit'
import { planGatePlugin } from './plugins/plan-gate'
import { inboxRoutes } from './routes/inboxes'
import { messageRoutes } from './routes/messages'
import { streamRoutes } from './routes/stream'
import { orgRoutes } from './routes/orgs'
import { categoryRoutes } from './routes/categories'
import { domainRoutes } from './routes/domains'
import { billingRoutes } from './routes/billing'
import { configRoutes } from './routes/config.js'
import { setupRoutes } from './routes/setup.js'
import { getConfig } from '@rawmail/config'
import { startTtlCron } from './services/ttl.service'
import { InboxService } from './services/inbox.service'
import { DomainService } from './services/domain.service'

declare module 'fastify' {
  interface FastifyInstance {
    auth?: ReturnType<typeof createAuth>
  }
}

export function buildApp(opts: FastifyServerOptions = {}) {
  const app = Fastify({ logger: true, ...opts })
  app.register(swagger, {
    openapi: {
      info: { title: 'rawmail API', version: '1.0.0' },
      servers: [{ url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001' }],
    },
  })
  app.register(swaggerUi, { routePrefix: '/docs' })
  app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: false,
    runFirst: true,
  })
  app.register(dbPlugin)
  app.register(redisPlugin)
  app.register(rateLimitPlugin)
  app.register(planGatePlugin)
  app.register(inboxRoutes, { prefix: '/v1/inboxes' })
  app.register(messageRoutes, { prefix: '/v1/messages' })
  app.register(streamRoutes, { prefix: '/v1/inboxes' })
  app.register(orgRoutes, { prefix: '/v1/orgs' })
  app.register(categoryRoutes, { prefix: '/v1/orgs' })
  app.register(domainRoutes, { prefix: '/v1/orgs' })
  app.register(configRoutes, { prefix: '/v1/config' })

  const cfg = getConfig()
  if (!cfg.isSaas) {
    app.register(setupRoutes, { prefix: '/v1/setup' })
  }
  if (cfg.isSaas) {
    app.register(billingRoutes, { prefix: '/v1/billing' })
  }

  app.addHook('onReady', async () => {
    app.auth = createAuth(app.db)
    startTtlCron(new InboxService(app.db))
    new DomainService(app.db).startPolling()
  })

  // Auth route: build a proper Web Request so better-auth gets a full URL with origin
  app.all('/v1/auth/*', { config: { rawBody: true } }, async (req, reply) => {
    if (!app.auth) return reply.code(503).send({ error: 'Auth unavailable' })

    const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'
    const url = new URL(req.url, base)

    const headers = new Headers()
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers.set(key, Array.isArray(val) ? val[0]! : val)
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const webRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body: hasBody ? (req as any).rawBody ?? null : null,
    })

    const response = await app.auth.handler(webRequest)
    const resHeaders: Record<string, string> = {}
    response.headers.forEach((val, key) => { resHeaders[key] = val })
    reply.raw.writeHead(response.status, resHeaders)
    reply.raw.end(await response.text())
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  const app = buildApp()
  app.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}
