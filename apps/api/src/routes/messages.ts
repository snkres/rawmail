import type { FastifyPluginAsync } from 'fastify'
import { MessageService } from '../services/message.service'

interface MessageRoutesOpts {
  messageService?: MessageService
}

export const messageRoutes: FastifyPluginAsync<MessageRoutesOpts> = async (
  app,
  opts,
) => {
  const messageService = opts.messageService ?? new MessageService(app.db)

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const message = await messageService.getById(req.params.id)
    if (!message) return reply.code(404).send({ error: 'Not found' })
    return message
  })

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await messageService.delete(req.params.id)
    return reply.code(204).send()
  })
}
