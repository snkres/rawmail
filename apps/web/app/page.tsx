import Link from 'next/link'
import { InboxInput } from '@/components/InboxInput'

const features = [
  {
    title: 'Claimed inboxes',
    desc: 'Lock an inbox to a secret token. Invisible to anyone without it.',
  },
  {
    title: 'Pixel stripping',
    desc: 'Tracking pixels removed server-side before delivery.',
  },
  {
    title: 'REST + SSE API',
    desc: 'Full API and real-time streaming.',
  },
  {
    title: 'Zero logs',
    desc: 'No IP logging. No metadata retention.',
  },
  {
    title: 'Custom domains',
    desc: 'Use your own domain for org inboxes.',
  },
  {
    title: 'Open source',
    desc: 'MIT licensed. Self-host with docker compose up.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">rawmail</span>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white">
          Sign in
        </Link>
      </nav>

      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Disposable email <span className="text-green-400">done right</span>
        </h1>
        <p className="text-gray-400 text-lg mb-12">
          Private, owned inboxes with a real API. No sign-up, no tracking, no ads.
        </p>
        <InboxInput />
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
