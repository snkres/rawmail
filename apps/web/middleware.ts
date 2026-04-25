import { NextRequest, NextResponse } from 'next/server'

const IS_SAAS = (process.env.IS_SAAS ?? 'true') !== 'false'
const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

async function getSession(req: NextRequest) {
  try {
    const res = await fetch(`${API_BASE}/v1/auth/get-session`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function isSetupComplete(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/v1/setup/status`, {
      cache: 'no-store',
    })
    if (!res.ok) return false
    const data = await res.json()
    return (data as any).setupComplete === true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (IS_SAAS) {
    // Self-hosted-only routes → redirect to home in SaaS mode
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/setup')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    // Protected routes → require session
    if (pathname.startsWith('/org/') || pathname === '/dashboard') {
      const session = await getSession(req)
      if (!session?.user) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    return NextResponse.next()
  }

  // ── Self-hosted mode ──────────────────────────────────────────────
  const setupComplete = await isSetupComplete()

  // Block SaaS-only routes
  if (pathname === '/login' || pathname === '/pricing') {
    return NextResponse.redirect(new URL(setupComplete ? '/sign-in' : '/setup', req.url))
  }

  // Root → sign-in or setup
  if (pathname === '/') {
    return NextResponse.redirect(new URL(setupComplete ? '/sign-in' : '/setup', req.url))
  }

  // /setup/* — only accessible before first org
  if (pathname.startsWith('/setup')) {
    if (setupComplete) return NextResponse.redirect(new URL('/sign-in', req.url))
    return NextResponse.next()
  }

  // /sign-in — only after setup
  if (pathname.startsWith('/sign-in')) {
    if (!setupComplete) return NextResponse.redirect(new URL('/setup', req.url))
    return NextResponse.next()
  }

  // Protected app routes
  if (pathname.startsWith('/org/') || pathname === '/dashboard') {
    const session = await getSession(req)
    if (!session?.user) {
      return NextResponse.redirect(new URL(setupComplete ? '/sign-in' : '/setup', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|_next/webpack-hmr).*)'],
}
