'use client'
import { useEffect, useState } from 'react'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Member { id: string; email: string; role: 'owner' | 'member' }

export default function MembersTab({ slug, currentUserRole }: { slug: string; currentUserRole: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  useEffect(() => {
    authedFetch<Member[]>(`/v1/orgs/${slug}/members`).then(setMembers).catch(() => {})
  }, [slug])

  async function removeMember(id: string) {
    if (!confirm('Remove this member?')) return
    await authedFetch(`/v1/orgs/${slug}/members/${id}`, { method: 'DELETE' })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function changeRole(id: string, role: string) {
    await authedFetch(`/v1/orgs/${slug}/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: role as 'owner' | 'member' } : m))
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    try {
      await authedFetch(`/v1/orgs/${slug}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      })
      setInviteMsg(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch {
      setInviteMsg('Invite delivery not yet available — coming soon.')
    } finally {
      setInviting(false)
    }
  }

  const isOwner = currentUserRole === 'owner'

  return (
    <div className="space-y-6 max-w-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th className="pb-2">Member</th>
            <th className="pb-2">Role</th>
            {isOwner && <th className="pb-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map(m => (
            <tr key={m.id}>
              <td className="py-3 text-gray-900">{m.email}</td>
              <td className="py-3">
                {isOwner && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m.id, e.target.value)}
                    className="text-sm border border-gray-200 rounded px-2 py-1"
                  >
                    <option value="member">member</option>
                    <option value="owner">owner</option>
                  </select>
                ) : (
                  <span className={[
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    m.role === 'owner' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500',
                  ].join(' ')}>
                    {m.role}
                  </span>
                )}
              </td>
              {isOwner && (
                <td className="py-3 text-right">
                  {m.role !== 'owner' && (
                    <button onClick={() => removeMember(m.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isOwner && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Invite member</h3>
          <form onSubmit={invite} className="flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1"
              required
            />
            <Button type="submit" variant="yellow" disabled={inviting}>
              {inviting ? 'Sending…' : 'Invite'}
            </Button>
          </form>
          {inviteMsg && <p className="text-sm text-gray-500 mt-2">{inviteMsg}</p>}
        </div>
      )}
    </div>
  )
}
