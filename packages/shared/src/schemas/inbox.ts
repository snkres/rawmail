import { z } from 'zod'

export const InboxSchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  isClaimed: z.boolean(),
  ttlExpiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})

export const ClaimResponseSchema = z.object({
  token: z.string().length(64),
  inbox: InboxSchema,
})

export type Inbox = z.infer<typeof InboxSchema>
export type ClaimResponse = z.infer<typeof ClaimResponseSchema>
