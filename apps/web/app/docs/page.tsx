import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'

function Code({ children, lang = 'bash' }: { children: string; lang?: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm overflow-x-auto font-mono leading-relaxed my-4">
      <code>{children.trim()}</code>
    </pre>
  )
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-[13px] font-mono">
      {children}
    </code>
  )
}

function Method({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    DELETE: 'bg-red-100 text-red-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    PATCH: 'bg-purple-100 text-purple-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono ${colors[method] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {method}
    </span>
  )
}

function Endpoint({
  method,
  path,
  desc,
  auth,
}: {
  method: string
  path: string
  desc: string
  auth?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Method method={method} />
      <div className="min-w-0 flex-1">
        <InlineCode>{path}</InlineCode>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
        {auth && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            🔑 {auth}
          </span>
        )}
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 mb-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-24 space-y-1 text-sm">
            {[
              { href: '#overview', label: 'Overview' },
              { href: '#quickstart', label: 'Quickstart' },
              { href: '#authentication', label: 'Authentication' },
              { href: '#inboxes', label: 'Inboxes' },
              { href: '#messages', label: 'Messages' },
              { href: '#stream', label: 'SSE Stream' },
              { href: '#sdk', label: 'JavaScript SDK' },
              { href: '#self-host', label: 'Self-hosting' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 max-w-3xl">
          <div className="mb-10">
            <Badge variant="muted" className="mb-3">Documentation</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">rawmail API</h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              A simple REST API for creating and reading disposable inboxes with real-time SSE
              delivery. Base URL:{' '}
              <InlineCode>https://api.rawmail.sh</InlineCode>
            </p>
          </div>

          <Section id="overview" title="Overview">
            <p className="text-gray-600 mb-4 leading-relaxed">
              rawmail provides ephemeral email inboxes that anyone can access by address — no
              account required. Inboxes can be optionally <strong>claimed</strong> with a secret
              token to restrict access, and used with <strong>custom domains</strong> for team
              workflows (Teams plan).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'No auth required', desc: 'Anonymous inboxes work out of the box' },
                { label: 'Real-time', desc: 'Server-sent events for instant delivery' },
                { label: 'JSON', desc: 'All responses are application/json' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="quickstart" title="Quickstart">
            <p className="text-gray-600 mb-2 leading-relaxed">
              Open an inbox — it&apos;s created on first access:
            </p>
            <Code lang="bash">{`
curl https://api.rawmail.sh/v1/inboxes/hello@rawmail.sh
`}</Code>
            <p className="text-gray-600 mb-2">List messages:</p>
            <Code lang="bash">{`
curl https://api.rawmail.sh/v1/inboxes/hello@rawmail.sh/messages
`}</Code>
            <p className="text-gray-600 mb-2">Stream new messages in real time:</p>
            <Code lang="bash">{`
curl -N https://api.rawmail.sh/v1/inboxes/hello@rawmail.sh/stream
`}</Code>
          </Section>

          <Section id="authentication" title="Authentication">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Anonymous inboxes require no authentication. When you <strong>claim</strong> an inbox
              you receive a 64-character hex token. Pass it on subsequent requests:
            </p>
            <Code lang="bash">{`
X-Inbox-Token: <your-64-char-token>
`}</Code>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Org/team routes require a Better-auth session cookie (Google OAuth). Acquire one by
              signing in at <InlineCode>/v1/auth/sign-in/social</InlineCode>.
            </p>
          </Section>

          <Section id="inboxes" title="Inboxes">
            <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
              <Endpoint
                method="GET"
                path="/v1/inboxes/:address"
                desc="Get or create an inbox. Returns inbox metadata including TTL and claimed status."
              />
              <Endpoint
                method="GET"
                path="/v1/inboxes/:address/messages"
                desc="List all messages in the inbox, newest first."
                auth="X-Inbox-Token required if inbox is claimed"
              />
              <Endpoint
                method="POST"
                path="/v1/inboxes/:address/claim"
                desc="Claim the inbox. Returns a one-time 64-char token. Inbox becomes private."
              />
              <Endpoint
                method="PUT"
                path="/v1/inboxes/:address/ttl"
                desc="Extend the inbox TTL. Body: { days: number }."
                auth="X-Inbox-Token required"
              />
              <Endpoint
                method="DELETE"
                path="/v1/inboxes/:address"
                desc="Permanently delete the inbox and all its messages."
                auth="X-Inbox-Token required"
              />
            </div>

            <p className="text-gray-600 mb-2 font-medium">Inbox object</p>
            <Code lang="json">{`
{
  "id": "018f1c2d-...",
  "address": "hello@rawmail.sh",
  "isClaimed": false,
  "ttlExpiresAt": "2026-04-29T00:00:00.000Z",
  "createdAt": "2026-04-22T00:00:00.000Z"
}
`}</Code>
          </Section>

          <Section id="messages" title="Messages">
            <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
              <Endpoint
                method="GET"
                path="/v1/messages/:id"
                desc="Get a single message with full body and attachments."
              />
              <Endpoint
                method="DELETE"
                path="/v1/messages/:id"
                desc="Delete a single message."
              />
            </div>

            <p className="text-gray-600 mb-2 font-medium">Message object</p>
            <Code lang="json">{`
{
  "id": "018f1c2e-...",
  "inboxId": "018f1c2d-...",
  "fromAddress": "sender@example.com",
  "subject": "Hello world",
  "htmlBody": "<p>Hello!</p>",
  "textBody": "Hello!",
  "receivedAt": "2026-04-22T10:00:00.000Z"
}
`}</Code>
          </Section>

          <Section id="stream" title="SSE Stream">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Subscribe to real-time email delivery via{' '}
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Server-Sent Events
              </a>
              . The connection stays open and each new message is pushed as a{' '}
              <InlineCode>data:</InlineCode> event.
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
              <Endpoint
                method="GET"
                path="/v1/inboxes/:address/stream"
                desc="Open an SSE connection. Emits message events as JSON. Sends :ping every 25s."
                auth="X-Inbox-Token required if inbox is claimed"
              />
            </div>

            <p className="text-gray-600 mb-2 font-medium">Browser example</p>
            <Code lang="js">{`
const es = new EventSource(
  'https://api.rawmail.sh/v1/inboxes/hello@rawmail.sh/stream'
)

es.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log(message.subject, message.fromAddress)
}
`}</Code>

            <p className="text-gray-600 mb-2 font-medium">Event payload</p>
            <Code lang="json">{`
{
  "id": "018f1c2e-...",
  "inboxId": "018f1c2d-...",
  "fromAddress": "sender@example.com",
  "subject": "Hello world",
  "receivedAt": "2026-04-22T10:00:00.000Z"
}
`}</Code>
          </Section>

          <Section id="sdk" title="JavaScript SDK">
            <p className="text-gray-600 mb-4 leading-relaxed">
              The <InlineCode>@rawmail/sdk</InlineCode> package wraps the REST API and SSE stream
              with a fully-typed client.
            </p>
            <Code lang="bash">{`npm install @rawmail/sdk`}</Code>

            <p className="text-gray-600 mb-2 font-medium">Usage</p>
            <Code lang="ts">{`
import { RawmailClient } from '@rawmail/sdk'

const client = new RawmailClient({
  baseUrl: 'https://api.rawmail.sh', // optional
})

// Get or create an inbox
const inbox = await client.inboxes.getOrCreate('hello@rawmail.sh')

// List messages
const messages = await client.inboxes.listMessages('hello@rawmail.sh')

// Claim an inbox
const { token } = await client.inboxes.claim('hello@rawmail.sh')

// Stream messages (async generator)
for await (const msg of client.inboxes.stream('hello@rawmail.sh')) {
  console.log(msg.subject)
}
`}</Code>
          </Section>

          <Section id="self-host" title="Self-hosting">
            <p className="text-gray-600 mb-4 leading-relaxed">
              rawmail is MIT licensed and ships with a production-ready Docker Compose setup. You
              need a server with a public IP and control over DNS.
            </p>
            <p className="text-gray-600 mb-2 font-medium">1. Clone and configure</p>
            <Code lang="bash">{`
git clone https://github.com/rawmail/rawmail
cp .env.example .env
# Edit .env with your domain, Google OAuth creds, Stripe keys
`}</Code>

            <p className="text-gray-600 mb-2 font-medium">2. Point DNS at your server</p>
            <Code lang="bash">{`
# A record
yourdomain.com  →  <your-server-ip>

# MX record (for receiving email)
yourdomain.com  MX 10  yourdomain.com
`}</Code>

            <p className="text-gray-600 mb-2 font-medium">3. Start</p>
            <Code lang="bash">{`docker compose up -d`}</Code>

            <p className="text-gray-600 mt-4 leading-relaxed">
              Caddy handles TLS automatically via Let&apos;s Encrypt. Migrations run on first boot
              via the API entrypoint.
            </p>
          </Section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-10">
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
