import type { FastifyPluginAsync } from 'fastify'
import { BillingService } from '../services/billing.service'

interface BillingRoutesOpts {
  billingService?: BillingService
}

export const billingRoutes: FastifyPluginAsync<BillingRoutesOpts> = async (app, opts) => {
  const billingService = opts.billingService ?? new BillingService(app.db)

  app.post<{ Body: { orgId: string; successUrl: string; cancelUrl: string } }>(
    '/checkout',
    async (req) => {
      return billingService.createCheckoutSession(req.body.orgId, req.body.successUrl, req.body.cancelUrl)
    },
  )

  app.post<{ Body: { orgId: string; returnUrl: string } }>('/portal', async (req) => {
    return billingService.createPortalSession(req.body.orgId, req.body.returnUrl)
  })

  app.post(
    '/webhook',
    {
      config: { rawBody: true },
    },
    async (req: any, reply) => {
      const sig = req.headers['stripe-signature'] as string | undefined
      if (!sig) return reply.code(400).send({ error: 'Missing signature' })
      try {
        const rawBody = Buffer.isBuffer(req.rawBody)
          ? req.rawBody
          : Buffer.from(req.rawBody ?? '', 'utf8')
        await billingService.handleWebhook(rawBody, sig)
        return { received: true }
      } catch (err: any) {
        return reply.code(400).send({ error: err.message })
      }
    },
  )
}
