'use client'
import { useState } from 'react'
import { Inbox, Clock } from 'lucide-react'
import { useInboxStream } from '@/lib/sse'
import { MessageDetail } from './MessageDetail'
import type { Message } from '@rawmail/shared'

interface Props {
  address: string
  initialMessages: Message[]
  token?: string
}

export function MessageList({ address, initialMessages, token }: Props) {
  const streamMessages = useInboxStream(address, token)
  const [selected, setSelected] = useState<Message | null>(null)

  const all = [...streamMessages, ...initialMessages].filter(
    (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i,
  )

  if (selected) {
    return <MessageDetail message={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-2">
      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Waiting for emails…</p>
          <p className="text-sm text-gray-400">
            Send an email to{' '}
            <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs text-gray-600">
              {address}
            </code>
          </p>
        </div>
      )}
      {all.map((m) => (
        <button
          key={m.id}
          onClick={() => setSelected(m)}
          className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-yellow hover:shadow-sm transition-all duration-150 group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-900">
                {m.fromAddress || 'Unknown sender'}
              </p>
              <p className="text-sm text-gray-700 truncate mt-0.5">{m.subject || '(no subject)'}</p>
              <p className="text-xs text-gray-400 truncate mt-1">
                {m.textBody?.slice(0, 120) || ''}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(m.receivedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
