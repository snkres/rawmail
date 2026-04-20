import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { billingRoutes } from '../src/routes/billing'

function buildTestApp() {
  const app = Fastify({ logger: false })
  const mockBillingService = {
    createCheckoutSession: vi.fn(async () => ({ url: 'https://checkout.stripe.com/session' })),
    createPortalSession: vi.fn(async () => ({ url: 'https://billing.stripe.com/session' })),
    handleWebhook: vi.fn(async () => {}),
  }

  app.decorate('db', {} as any)
  app.register(billingRoutes, { prefix: '/v1/billing', billingService: mockBillingService as any })

  return { app, mockBillingService }
}

describe('billingRoutes', () => {
  it('creates checkout session', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/v1/billing/checkout',
      payload: { orgId: 'org-1', successUrl: 'http://ok', cancelUrl: 'http://cancel' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().url).toContain('stripe.com')
  })

  it('returns 400 when webhook signature is missing', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'POST', url: '/v1/billing/webhook', payload: {} })
    expect(res.statusCode).toBe(400)
  })
})
