'use client'
import { useEffect, useState, useCallback } from 'react'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Domain {
  id: string
  domain: string
  mxVerified: boolean
  instructions?: string
}

export default function DomainsTab({ slug }: { slug: string }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDomains = useCallback(async () => {
    try {
      const list = await authedFetch<Domain[]>(`/v1/orgs/${slug}/domains`)
      setDomains(list)
    } catch {}
  }, [slug])

  useEffect(() => { fetchDomains() }, [fetchDomains])

  // Poll unverified domains every 30s
  useEffect(() => {
    const hasUnverified = domains.some(d => !d.mxVerified)
    if (!hasUnverified) return
    const id = setInterval(fetchDomains, 30_000)
    return () => clearInterval(id)
  }, [domains, fetchDomains])

  async function addDomain(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const d = await authedFetch<Domain>(`/v1/orgs/${slug}/domains`, {
        method: 'POST',
        body: JSON.stringify({ domain: newDomain }),
      })
      setDomains(prev => [d, ...prev])
      setNewDomain('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain')
    } finally {
      setAdding(false)
    }
  }

  async function verify(domainId: string) {
    try {
      await authedFetch(`/v1/orgs/${slug}/domains/${domainId}/verify`)
      fetchDomains()
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={addDomain} className="flex gap-2">
        <Input
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
          placeholder="mail.yourcompany.com"
          className="flex-1"
          required
        />
        <Button type="submit" variant="yellow" disabled={adding}>
          {adding ? 'Adding…' : 'Add domain'}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-4">
        {domains.map(d => (
          <li key={d.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium text-gray-900">{d.domain}</span>
              <span className={[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                d.mxVerified ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {d.mxVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            {!d.mxVerified && d.instructions && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">Add this MX record:</p>
                <code className="text-xs text-gray-700 block">{d.instructions}</code>
              </div>
            )}
            {!d.mxVerified && (
              <Button variant="outline" onClick={() => verify(d.id)} className="text-xs h-7 px-3">
                Check now
              </Button>
            )}
          </li>
        ))}
        {domains.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">No custom domains yet</li>
        )}
      </ul>
    </div>
  )
}
