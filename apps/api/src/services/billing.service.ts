import { Polar } from '@polar-sh/sdk'
import type { Db } from '@rawmail/db'
import { orgs } from '@rawmail/db'
import { eq } from 'drizzle-orm'

export class BillingService {
  private polar: Polar

  constructor(private db: Db) {
    this.polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
      server: (['sandbox', 'production'].includes(process.env.POLAR_SERVER ?? '')
        ? process.env.POLAR_SERVER
        : 'sandbox') as 'sandbox' | 'production',
    })
  }

  async createCheckoutSession(orgId: string, successUrl: string, _cancelUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org) throw new Error('org not found')

    const checkout = await this.polar.checkouts.create({
      products: [process.env.POLAR_TEAMS_PRODUCT_ID ?? ''],
      successUrl,
      externalCustomerId: orgId,
      metadata: { orgId },
    })
    return { url: checkout.url }
  }

  async createPortalSession(orgId: string, _returnUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org?.polarCustomerId) throw new Error('no polar customer for this org')

    const session = await this.polar.customerSessions.create({
      customerId: org.polarCustomerId,
    })
    return { url: session.customerPortalUrl }
  }

  async handleWebhook(payload: any) {
    const { type, data } = payload

    if (type === 'subscription.created' || type === 'subscription.updated') {
      const orgId = data.metadata?.orgId ?? data.customer?.externalId
      if (!orgId) return
      const plan = data.status === 'active' ? 'teams' : 'free'
      await this.db.update(orgs)
        .set({ plan, polarCustomerId: data.customer?.id ?? null })
        .where(eq(orgs.id, orgId))
    }

    if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const orgId = data.metadata?.orgId ?? data.customer?.externalId
      if (orgId) {
        await this.db.update(orgs).set({ plan: 'free' }).where(eq(orgs.id, orgId))
      }
    }

    if (type === 'customer.created') {
      const { externalId, id: polarCustomerId } = data
      if (externalId) {
        await this.db.update(orgs).set({ polarCustomerId }).where(eq(orgs.id, externalId))
      }
    }
  }
}
