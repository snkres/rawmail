import type { Inbox, Message, ClaimResponse } from '@rawmail/shared'

export class InboxesNamespace {
  constructor(
    private baseUrl: string,
    private defaultToken?: string,
  ) {}

  private headers(token?: string): HeadersInit {
    const tok = token ?? this.defaultToken
    return tok ? { 'X-Inbox-Token': tok } : {}
  }

  async getOrCreate(address: string): Promise<Inbox> {
    const res = await fetch(`${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async listMessages(address: string, token?: string): Promise<Message[]> {
    const res = await fetch(
      `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/messages`,
      { headers: this.headers(token) },
    )
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async claim(address: string): Promise<ClaimResponse> {
    const res = await fetch(
      `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/claim`,
      { method: 'POST' },
    )
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async *stream(address: string, token?: string): AsyncGenerator<Message> {
    const url = `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/stream`
    const headers = this.headers(token)

    const res = await fetch(url, { headers })
    if (!res.ok || !res.body) throw new Error(`Stream error ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data && data !== ':ping') {
            yield JSON.parse(data) as Message
          }
        }
      }
    }
  }
}
