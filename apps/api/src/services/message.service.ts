import { eq } from 'drizzle-orm'
import { inboxes, messages, type Db } from '@rawmail/db'

export class MessageService {
  constructor(private db: Db) {}

  async listByInbox(address: string) {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox) return []

    return this.db.query.messages.findMany({
      where: eq(messages.inboxId, inbox.id),
      orderBy: (m, { desc }) => [desc(m.receivedAt)],
    })
  }

  async getById(id: string) {
    return this.db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { attachments: true },
    })
  }

  async delete(id: string) {
    await this.db.delete(messages).where(eq(messages.id, id))
  }
}
