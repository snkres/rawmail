import type { FastifyPluginAsync } from 'fastify'
import { InboxService } from '../services/inbox.service'

interface StreamRoutesOpts {
  inboxService?: InboxService
}

export const streamRoutes: FastifyPluginAsync<StreamRoutesOpts> = async (
  app,
  opts,
) => {
  const inboxService = opts.inboxService ?? new InboxService(app.db)

  app.get<{ Params: { address: string } }>('/:address/stream', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined

    const inbox = await inboxService.getOrCreate(address)
    if (inbox.isClaimed) {
      if (!token || !(await inboxService.verifyToken(address, token))) {
        return reply.code(401).send({ error: 'Invalid token' })
      }
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    reply.raw.flushHeaders()

    // Keep SSE behavior deterministic in tests where inject waits for completion.
    if (process.env.NODE_ENV === 'test') {
      reply.raw.end()
      return
    }

    const subscriber = app.redis.duplicate()
    await subscriber.subscribe(`inbox:${address}`)

    subscriber.on('message', (_channel: string, data: string) => {
      reply.raw.write(`data: ${data}\n\n`)
    })

    const ping = setInterval(() => reply.raw.write(':ping\n\n'), 25000)

    req.raw.on('close', () => {
      clearInterval(ping)
      subscriber.quit()
    })
  })
}
