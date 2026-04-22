'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { ClaimResponse } from '@rawmail/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  address: string
}

export function ClaimModal({ address }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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

  async function copyToken() {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Claim inbox
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {token ? (
            <>
              <DialogHeader>
                <DialogTitle>Inbox claimed ✓</DialogTitle>
                <DialogDescription>
                  Save this token — it will not be shown again. Anyone with it can read this inbox.
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <code className="block bg-gray-50 border border-gray-200 text-gray-800 text-xs p-4 rounded-xl break-all font-mono leading-relaxed pr-12">
                  {token}
                </code>
                <button
                  onClick={copyToken}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="Copy token"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </button>
              </div>
              <Button
                variant="default"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Claim this inbox?</DialogTitle>
                <DialogDescription>
                  Claiming locks{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-800">
                    {address}
                  </code>{' '}
                  to a secret token. Only you will be able to read it — it becomes invisible to
                  everyone else.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleClaim}
                  disabled={loading}
                >
                  {loading ? 'Claiming…' : 'Claim inbox'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
