import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  })
})
