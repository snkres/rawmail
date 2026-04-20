import { z } from 'zod'

export const MessageSchema = z.object({
  id: z.string().uuid(),
  inboxId: z.string().uuid(),
  fromAddress: z.string(),
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string(),
  receivedAt: z.string().datetime(),
})

export type Message = z.infer<typeof MessageSchema>
