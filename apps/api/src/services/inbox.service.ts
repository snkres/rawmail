import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { eq, lt } from 'drizzle-orm'
import { inboxes, type Db } from '@rawmail/db'

const FREE_TTL_DAYS = 7

export class InboxService {
  constructor(private db: Db) {}

  async getOrCreate(address: string) {
    const existing = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (existing) return existing

    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + FREE_TTL_DAYS)

    const [inbox] = await this.db
      .insert(inboxes)
      .values({ address, ttlExpiresAt })
      .returning()
    return inbox
  }

  async claim(address: string) {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox) throw new Error('Inbox not found')
    if (inbox.isClaimed) throw new Error('Inbox already claimed')

    const token = randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(token, 10)

    const [updated] = await this.db
      .update(inboxes)
      .set({ tokenHash, isClaimed: true })
      .where(eq(inboxes.address, address))
      .returning()

    return { token, inbox: updated }
  }

  async verifyToken(address: string, token: string): Promise<boolean> {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox?.tokenHash) return false
    return bcrypt.compare(token, inbox.tokenHash)
  }

  async delete(address: string) {
    await this.db.delete(inboxes).where(eq(inboxes.address, address))
  }

  async extendTtl(address: string, days: number) {
    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + days)
    const [updated] = await this.db
      .update(inboxes)
      .set({ ttlExpiresAt })
      .where(eq(inboxes.address, address))
      .returning()
    return updated
  }

  async deleteExpired(): Promise<number> {
    const deleted = await this.db
      .delete(inboxes)
      .where(lt(inboxes.ttlExpiresAt, new Date()))
      .returning()
    return deleted.length
  }
}
