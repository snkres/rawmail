import { eq } from 'drizzle-orm'
import { orgs, users, inboxes, type Db } from '@rawmail/db'

export class OrgService {
  constructor(private db: Db) {}

  async create(data: { name: string; slug: string; ownerId: string }) {
    const [org] = await this.db.insert(orgs).values({ name: data.name, slug: data.slug }).returning()

    await this.db
      .update(users)
      .set({ orgId: org.id, role: 'owner' })
      .where(eq(users.id, data.ownerId))

    return org
  }

  async getBySlug(slug: string) {
    return this.db.query.orgs.findFirst({ where: eq(orgs.slug, slug) })
  }

  async update(slug: string, data: { name?: string; ssoDomain?: string }) {
    const [updated] = await this.db.update(orgs).set(data).where(eq(orgs.slug, slug)).returning()
    return updated
  }

  async listInboxes(slug: string) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    return this.db.query.inboxes.findMany({
      where: eq(inboxes.orgId, org.id),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    })
  }

  async createInbox(slug: string, address: string, ttlDays = 30) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + ttlDays)
    const [inbox] = await this.db.insert(inboxes).values({ address, orgId: org.id, ttlExpiresAt }).returning()
    return inbox
  }

  async listMembers(slug: string) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    return this.db.query.users.findMany({ where: eq(users.orgId, org.id) })
  }

  async removeMember(_orgSlug: string, userId: string) {
    await this.db.update(users).set({ orgId: null, role: 'member' }).where(eq(users.id, userId))
  }

  async updateMemberRole(userId: string, role: string) {
    await this.db.update(users).set({ role }).where(eq(users.id, userId))
  }
}
