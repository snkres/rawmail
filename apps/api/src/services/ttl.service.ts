import cron from 'node-cron'
import type { InboxService } from './inbox.service'

export function startTtlCron(inboxService: InboxService) {
  return cron.schedule('0 * * * *', async () => {
    const count = await inboxService.deleteExpired()
    if (count > 0) {
      console.log(`[ttl-cron] Purged ${count} expired inboxes`)
    }
  })
}
