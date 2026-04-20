import { MessageList } from '@/components/MessageList'
import { apiFetch } from '@/lib/api'
import type { Inbox, Message } from '@rawmail/shared'
import { ClaimModal } from '@/components/ClaimModal'

interface Props {
  params: Promise<{ address: string }>
}

export default async function InboxPage({ params }: Props) {
  const resolvedParams = await params
  const address = decodeURIComponent(resolvedParams.address)
  const [inbox, messages] = await Promise.all([
    apiFetch<Inbox>(`/v1/inboxes/${address}`),
    apiFetch<Message[]>(`/v1/inboxes/${address}/messages`),
  ])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <a href="/" className="text-xl font-bold tracking-tight">
          rawmail
        </a>
        <div className="flex items-center gap-4">
          <code className="text-sm text-green-400 bg-gray-900 px-3 py-1 rounded">
            {address}
          </code>
          {!inbox.isClaimed && <ClaimModal address={address} />}
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <MessageList address={address} initialMessages={messages} />
      </div>
    </main>
  )
}
