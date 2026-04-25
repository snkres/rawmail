import type { FastifyPluginAsync } from 'fastify'
import { Webhooks } from '@polar-sh/fastify'
import { BillingService } from '../services/billing.service'

export const billingRoutes: FastifyPluginAsync = async (app) => {
  const billingService = new BillingService(app.db)

  // POST /v1/billing/checkout
  app.post('/checkout', async (req, reply) => {
    const { orgId, successUrl, cancelUrl } = req.body as any
    const result = await billingService.createCheckoutSession(orgId, successUrl, cancelUrl)
    return reply.send(result)
  })

  // POST /v1/billing/portal
  app.post('/portal', async (req, reply) => {
    const { orgId, returnUrl } = req.body as any
    const result = await billingService.createPortalSession(orgId, returnUrl)
    return reply.send(result)
  })

  // POST /v1/billing/webhook — Polar webhook with signature verification
  app.post('/webhook', Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    onPayload: async (payload) => {
      await billingService.handleWebhook(payload)
    },
  }))
}
