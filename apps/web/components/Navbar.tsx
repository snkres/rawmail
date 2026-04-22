'use client'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            rawmail
          </Link>
          <Badge variant="yellow" className="text-[10px] font-bold uppercase tracking-wide">
            Beta
          </Badge>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Docs
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Pricing
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div className="w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center text-xs font-bold text-gray-900">
                  {session.user.email?.[0]?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
                </div>
                <span className="max-w-[140px] truncate">{session.user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
