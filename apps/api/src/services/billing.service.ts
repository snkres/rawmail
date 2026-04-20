import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { orgs, type Db } from '@rawmail/db'

const TEAMS_PRICE_ID = process.env.STRIPE_TEAMS_PRICE_ID ?? ''

export class BillingService {
  private stripe: Stripe

  constructor(private db: Db) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
  }

  async createCheckoutSession(orgId: string, successUrl: string, cancelUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org) throw new Error('Org not found')

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: TEAMS_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId },
    })

    return { url: session.url }
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org?.stripeCustomerId) throw new Error('No billing account found')

    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl,
    })
    return { url: session.url }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.orgId
      if (orgId && session.customer) {
        await this.db
          .update(orgs)
          .set({ stripeCustomerId: session.customer as string })
          .where(eq(orgs.id, orgId))
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object as Stripe.Subscription
      const plan = sub.status === 'active' ? 'teams' : 'free'
      await this.db
        .update(orgs)
        .set({ plan, stripeSubscriptionId: sub.id })
        .where(eq(orgs.stripeCustomerId, sub.customer as string))
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await this.db
        .update(orgs)
        .set({ plan: 'free', stripeSubscriptionId: null })
        .where(eq(orgs.stripeCustomerId, sub.customer as string))
    }
  }
}
