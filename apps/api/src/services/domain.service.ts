import { eq } from 'drizzle-orm'
import { promises as dns } from 'dns'
import { domains, type Db } from '@rawmail/db'
import cron from 'node-cron'
import { getConfig } from '@rawmail/config'

export class DomainService {
  constructor(private db: Db) {}

  async add(orgId: string, domain: string) {
    const [d] = await this.db.insert(domains).values({ orgId, domain }).returning()
    return d
  }

  async verify(id: string) {
    const domain = await this.db.query.domains.findFirst({ where: eq(domains.id, id) })
    if (!domain) throw new Error('Domain not found')

    try {
      const addresses = await dns.resolveMx(domain.domain)
      const verified = addresses.some((mx) => mx.exchange.toLowerCase() === getConfig().mxTarget.toLowerCase())
      if (verified) {
        await this.db
          .update(domains)
          .set({ mxVerified: true, verifiedAt: new Date() })
          .where(eq(domains.id, id))
      }
      return { verified, addresses }
    } catch {
      return { verified: false, addresses: [] }
    }
  }

  startPolling() {
    return cron.schedule('*/15 * * * *', async () => {
      const unverified = await this.db.query.domains.findMany({
        where: eq(domains.mxVerified, false),
      })
      for (const d of unverified) {
        await this.verify(d.id)
      }
    })
  }
}
