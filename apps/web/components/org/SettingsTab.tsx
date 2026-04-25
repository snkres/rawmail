'use client'
import { useState } from 'react'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OrgData { id: string; name: string; ssoDomain: string | null; plan: string }

export default function SettingsTab({ slug, org, isSaas }: { slug: string; org: OrgData; isSaas: boolean }) {
  const [name, setName] = useState(org.name)
  const [ssoDomain, setSsoDomain] = useState(org.ssoDomain ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await authedFetch(`/v1/orgs/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, ssoDomain: ssoDomain || null }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function upgrade() {
    const { url } = await authedFetch<{ url: string }>('/v1/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({
        orgId: org.id,
        successUrl: `${window.location.href}?upgraded=1`,
        cancelUrl: window.location.href,
      }),
    })
    window.location.href = url
  }

  async function manageBilling() {
    const { url } = await authedFetch<{ url: string }>('/v1/billing/portal', {
      method: 'POST',
      body: JSON.stringify({ orgId: org.id, returnUrl: window.location.href }),
    })
    window.location.href = url
  }

  const isTeams = org.plan === 'teams'

  return (
    <div className="space-y-8 max-w-lg">
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">General</h2>
        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SSO domain</label>
            <Input
              value={ssoDomain}
              onChange={e => setSsoDomain(e.target.value)}
              placeholder="yourcompany.com"
            />
            <p className="text-xs text-gray-400 mt-1">Users with this email domain auto-join your workspace</p>
          </div>
          <Button type="submit" variant="yellow" disabled={saving}>
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </section>

      {isSaas && (
        <section className="border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Billing</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current plan</p>
              <span className={[
                'mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium',
                isTeams ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {isTeams ? 'Teams — $9.99/mo' : 'Free'}
              </span>
            </div>
            {isTeams ? (
              <Button variant="outline" onClick={manageBilling}>Manage billing</Button>
            ) : (
              <Button variant="yellow" onClick={upgrade}>Upgrade to Teams</Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
