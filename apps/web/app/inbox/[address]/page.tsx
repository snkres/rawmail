import Link from 'next/link'
import { cookies } from 'next/headers'
import { MessageList } from '@/components/MessageList'
import { ClaimModal } from '@/components/ClaimModal'
import { serverFetch } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import type { Inbox, Message } from '@rawmail/shared'

interface Props {
  params: Promise<{ address: string }>
}

export default async function InboxPage({ params }: Props) {
  const resolvedParams = await params
  const address = decodeURIComponent(resolvedParams.address)

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const [inbox, messages] = await Promise.all([
    serverFetch<Inbox>(`/v1/inboxes/${address}`, cookieHeader),
    serverFetch<Message[]>(`/v1/inboxes/${address}/messages`, cookieHeader),
  ])

  const isOrgOwned = (inbox as any).orgId != null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-900 shrink-0">
            rawmail
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <code className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded-lg truncate max-w-xs">
              {address}
            </code>
            {inbox.isClaimed && (
              <Badge variant="muted">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                Claimed
              </Badge>
            )}
          </div>
          {!inbox.isClaimed && !isOrgOwned && <ClaimModal address={address} />}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {messages.length > 0
                ? `${messages.length} message${messages.length === 1 ? '' : 's'}`
                : 'No messages yet'}
            </p>
          </div>
        </div>
        <MessageList address={address} initialMessages={messages} isOrgOwned={isOrgOwned} />
      </main>
    </div>
  )
}
