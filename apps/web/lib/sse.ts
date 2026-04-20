'use client'
import { useEffect, useState } from 'react'
import type { Message } from '@rawmail/shared'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useInboxStream(address: string, _token?: string) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const url = new URL(`${BASE}/v1/inboxes/${encodeURIComponent(address)}/stream`)
    const es = new EventSource(url.toString())

    es.onmessage = (e) => {
      if (e.data === ':ping') return
      try {
        const msg: Message = JSON.parse(e.data)
        setMessages((prev) => [msg, ...prev])
      } catch {
        // Ignore malformed SSE payloads.
      }
    }

    return () => es.close()
  }, [address])

  return messages
}
