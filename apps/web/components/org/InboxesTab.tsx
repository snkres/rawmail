'use client'
import { useState } from 'react'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Inbox { id: string; address: string; isClaimed: boolean }

export default function InboxesTab({
  slug,
  initialInboxes,
}: {
  slug: string
  initialInboxes: Inbox[]
}) {
  const [inboxes, setInboxes] = useState(initialInboxes)
  const [address, setAddress] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createInbox(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const inbox = await authedFetch<Inbox>(`/v1/orgs/${slug}/inboxes`, {
        method: 'POST',
        body: JSON.stringify({ address }),
      })
      setInboxes(prev => [inbox, ...prev])
      setAddress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inbox')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={createInbox} className="flex gap-2">
        <Input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="inbox address (without @domain)"
          className="flex-1"
          required
        />
        <Button type="submit" variant="yellow" disabled={creating}>
          {creating ? 'Adding…' : 'Add inbox'}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {inboxes.map(inbox => (
          <li key={inbox.id} className="py-3 flex items-center gap-2">
            <a
              href={`/inbox/${inbox.address}`}
              className="font-mono text-sm text-gray-900 hover:text-yellow-500 transition-colors"
            >
              {inbox.address}
            </a>
            {inbox.isClaimed && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">claimed</span>
            )}
          </li>
        ))}
        {inboxes.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">No inboxes yet</li>
        )}
      </ul>
    </div>
  )
}
