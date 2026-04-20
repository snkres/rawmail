'use client'
import { useState } from 'react'
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
    <div>
      {all.length === 0 && (
        <p className="text-gray-500 text-center py-16">Waiting for emails...</p>
      )}
      {all.map((m) => (
        <button
          key={m.id}
          onClick={() => setSelected(m)}
          className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg p-4 mb-2 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{m.fromAddress}</span>
            <span className="text-xs text-gray-500">
              {new Date(m.receivedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-300">{m.subject}</p>
          <p className="text-xs text-gray-500 truncate mt-1">{m.textBody.slice(0, 100)}</p>
        </button>
      ))}
    </div>
  )
}
