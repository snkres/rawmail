import Link from 'next/link'
import { ArrowRight, Shield, Zap, Globe, Lock, Code2, GitFork } from 'lucide-react'
import { InboxInput } from '@/components/InboxInput'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Lock,
    title: 'Claimed inboxes',
    desc: 'Lock an inbox with a secret token. Only you can read it — completely invisible to others.',
  },
  {
    icon: Shield,
    title: 'Pixel stripping',
    desc: 'Tracking pixels removed server-side before storage. No read receipts, ever.',
  },
  {
    icon: Zap,
    title: 'Real-time SSE',
    desc: 'Emails appear instantly via server-sent events. No polling, no delays.',
  },
  {
    icon: Code2,
    title: 'REST + SDK',
    desc: 'Full REST API with OpenAPI spec and a typed npm SDK. Build on top of it.',
  },
  {
    icon: Globe,
    title: 'Custom domains',
    desc: 'Use your own domain. Route tmp.acme.com through rawmail for team inboxes.',
  },
  {
    icon: GitFork,
    title: 'Open source',
    desc: 'MIT licensed. Audit the code. Self-host with a single docker compose up.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          No sign-up required
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Disposable email
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 px-2">done right.</span>
            <span
              className="absolute inset-x-0 bottom-1 h-4 bg-brand-yellow -rotate-1 z-0 rounded"
              aria-hidden="true"
            />
          </span>
        </h1>

        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Private, owned inboxes with a real API. No sign-up. No tracking. No ads.
          Just type an address and go.
        </p>

        <InboxInput />

        <p className="mt-4 text-sm text-gray-400">
          Try{' '}
          <code className="bg-gray-100 rounded px-1.5 py-0.5 text-gray-600 text-xs">
            anything@rawmail.sh
          </code>{' '}
          — it just works.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-brand-yellow hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-brand-yellow transition-colors flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Teams get more.</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Google OAuth SSO, custom domains, named inboxes, categories, and 30-day TTL —
            starting at $9.99/mo.
          </p>
          <Button variant="yellow" size="lg" asChild>
            <Link href="/login">
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-900">rawmail</span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <a
              href="https://github.com/rawmail/rawmail"
              className="hover:text-gray-700 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
