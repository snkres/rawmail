import { apiFetch } from '@/lib/api'
import type { Inbox } from '@rawmail/shared'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OrgDashboard({ params }: Props) {
  const { slug } = await params
  const inboxes = await apiFetch<Inbox[]>(`/v1/orgs/${slug}/inboxes`)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <a href="/" className="text-xl font-bold">
          rawmail
        </a>
        <span className="text-sm text-gray-400">{slug}</span>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Inboxes</h1>
        <div className="space-y-2">
          {inboxes.map((inbox) => (
            <a
              key={inbox.id}
              href={`/inbox/${encodeURIComponent(inbox.address)}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors"
            >
              <span className="text-green-400 text-sm font-mono">{inbox.address}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
