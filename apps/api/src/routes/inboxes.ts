import type { FastifyPluginAsync } from 'fastify'
import { InboxService } from '../services/inbox.service'
import { MessageService } from '../services/message.service'

interface InboxRoutesOpts {
  inboxService?: InboxService
}

export const inboxRoutes: FastifyPluginAsync<InboxRoutesOpts> = async (
  app,
  opts,
) => {
  const inboxService = opts.inboxService ?? new InboxService(app.db)
  const messageService = new MessageService(app.db)

  app.get<{ Params: { address: string } }>('/:address', async (req) => {
    return inboxService.getOrCreate(req.params.address)
  })

  app.get<{ Params: { address: string } }>(
    '/:address/messages',
    async (req, reply) => {
      const { address } = req.params
      const token = req.headers['x-inbox-token'] as string | undefined
      const inbox = await inboxService.getOrCreate(address)

      if (inbox.isClaimed) {
        if (!token || !(await inboxService.verifyToken(address, token))) {
          return reply.code(401).send({ error: 'Invalid token' })
        }
      }

      return messageService.listByInbox(address)
    },
  )

  app.post<{ Params: { address: string } }>('/:address/claim', async (req, reply) => {
    const result = await inboxService.claim(req.params.address)
    return reply.code(201).send(result)
  })

  app.delete<{ Params: { address: string } }>('/:address', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined
    if (!token || !(await inboxService.verifyToken(address, token))) {
      return reply.code(401).send({ error: 'Invalid token' })
    }
    await inboxService.delete(address)
    return reply.code(204).send()
  })

  app.put<{ Params: { address: string }; Body: { days: number } }>(
    '/:address/ttl',
    async (req, reply) => {
      const { address } = req.params
      const token = req.headers['x-inbox-token'] as string | undefined
      if (!token || !(await inboxService.verifyToken(address, token))) {
        return reply.code(401).send({ error: 'Invalid token' })
      }
      return inboxService.extendTtl(address, req.body.days)
    },
  )
}
