'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { ClaimResponse } from '@rawmail/shared'

interface Props {
  address: string
}

export function ClaimModal({ address }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    setLoading(true)
    try {
      const res = await apiFetch<ClaimResponse>(`/v1/inboxes/${address}/claim`, {
        method: 'POST',
      })
      setToken(res.token)
      localStorage.setItem(`token:${address}`, res.token)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded hover:bg-yellow-400/10"
      >
        Claim inbox
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
        {token ? (
          <>
            <h3 className="font-semibold text-lg mb-2">Inbox claimed</h3>
            <p className="text-sm text-gray-400 mb-4">
              Save this token. It will not be shown again.
            </p>
            <code className="block bg-gray-950 text-green-400 text-xs p-3 rounded break-all mb-4">
              {token}
            </code>
            <button
              onClick={() => setOpen(false)}
              className="w-full bg-green-500 text-black font-semibold py-2 rounded"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-lg mb-2">Claim this inbox?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Claiming locks this inbox to a secret token.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-700 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={loading}
                className="flex-1 bg-green-500 text-black font-semibold py-2 rounded text-sm disabled:opacity-50"
              >
                {loading ? 'Claiming...' : 'Claim'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
