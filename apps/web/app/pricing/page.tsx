import Link from 'next/link'
import { Check, Minus, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getWebConfig } from '@/lib/app-config'
import { notFound } from 'next/navigation'

const free = [
  'Unlimited anonymous inboxes',
  'rawmail.sh domain',
  '7-day TTL on inboxes',
  'Real-time SSE delivery',
  'Claim inbox with secret token',
  'Tracking pixel stripping',
  'REST API access',
  'npm SDK',
  'Self-hostable (MIT)',
]

const teams = [
  'Everything in Free',
  'Google OAuth SSO',
  'Domain allowlist (auto-join)',
  'Custom email domains',
  'MX verification polling',
  'Named & categorized inboxes',
  '30-day TTL on inboxes',
  'Up to 10 team members',
  'Member role management',
  'Priority support',
]

const comparison = [
  { feature: 'Anonymous inboxes', free: true, teams: true },
  { feature: 'rawmail.sh addresses', free: true, teams: true },
  { feature: 'Real-time SSE', free: true, teams: true },
  { feature: 'Claimed inboxes', free: true, teams: true },
  { feature: 'Tracking pixel stripping', free: true, teams: true },
  { feature: 'REST API + SDK', free: true, teams: true },
  { feature: 'Inbox TTL', free: '7 days', teams: '30 days' },
  { feature: 'Custom domains', free: false, teams: true },
  { feature: 'Google SSO', free: false, teams: true },
  { feature: 'Domain allowlist', free: false, teams: true },
  { feature: 'Named inboxes', free: false, teams: true },
  { feature: 'Categories', free: false, teams: true },
  { feature: 'Team members', free: false, teams: 'Up to 10' },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-green-600 mx-auto" />
  if (value === false) return <Minus className="w-5 h-5 text-gray-300 mx-auto" />
  return <span className="text-sm font-medium text-gray-700">{value}</span>
}

export default function PricingPage() {
  if (!getWebConfig().isSaas) notFound()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <Badge variant="muted" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Free forever for personal use. Teams unlock collaboration, SSO, and custom domains.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-gray-200 p-8 bg-white">
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Free
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 mb-2">/ forever</span>
              </div>
              <p className="text-sm text-gray-500">No credit card. No account required.</p>
            </div>

            <Button variant="outline" size="lg" className="w-full mb-8" asChild>
              <Link href="/">Open an inbox →</Link>
            </Button>

            <ul className="space-y-3">
              {free.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Teams */}
          <div className="rounded-2xl border-2 border-brand-yellow p-8 bg-white relative">
            <div className="absolute -top-3 left-6">
              <Badge variant="yellow" className="font-bold text-xs px-3 py-1">
                Most popular
              </Badge>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Teams
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">$9.99</span>
                <span className="text-gray-400 mb-2">/ month</span>
              </div>
              <p className="text-sm text-gray-500">Per workspace. Unlimited team members up to 10.</p>
            </div>

            <Button variant="yellow" size="lg" className="w-full mb-8 gap-2" asChild>
              <Link href="/login">
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <ul className="space-y-3">
              {teams.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Feature comparison</h2>
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-1/2">Feature</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-700 w-1/4">Free</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-700 w-1/4">
                  <span className="text-brand-yellow-hover">Teams</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-gray-100 last:border-0 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-5 py-3 text-gray-700">{row.feature}</td>
                  <td className="px-5 py-3 text-center">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Cell value={row.teams} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
        <div className="space-y-6">
          {[
            {
              q: 'What happens when my free inbox expires?',
              a: 'After 7 days, unclaimed inboxes and their messages are permanently deleted. Claimed inboxes follow the same TTL but you can extend it via API.',
            },
            {
              q: 'Can I self-host rawmail?',
              a: "Yes — rawmail is MIT licensed. Clone the repo and run docker compose up. You'll need to provide your own SMTP hostname and configure DNS.",
            },
            {
              q: 'How does SSO work?',
              a: "On the Teams plan you configure a domain (e.g. penny.co). Anyone who signs in with Google using a @penny.co address is automatically added to your workspace.",
            },
            {
              q: 'Is there a free trial for Teams?',
              a: 'Yes — 14 days free, no credit card required at sign-up. You\'ll be prompted to add a card at the end of the trial.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-6 last:border-0">
              <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-900">rawmail</span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <a href="https://github.com/rawmail/rawmail" className="hover:text-gray-700 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
