// Server-side (SSR/RSC) uses internal Docker hostname; client-side uses public URL
const BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}

export async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).message ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

const SERVER_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function serverFetch<T>(
  path: string,
  cookieHeader: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${SERVER_BASE}${path}`, {
    ...init,
    headers: { cookie: cookieHeader, 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}
