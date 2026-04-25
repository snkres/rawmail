import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { TabBar } from '@/components/ui/tabs'
import { serverFetch } from '@/lib/api'

const TABS = [
  { id: 'inboxes', label: 'Inboxes' },
  { id: 'categories', label: 'Categories' },
  { id: 'members', label: 'Members' },
  { id: 'domains', label: 'Domains' },
  { id: 'settings', label: 'Settings' },
]

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function OrgPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { tab = 'inboxes' } = await searchParams
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const org = await serverFetch<any>(`/v1/orgs/${slug}`, cookieHeader).catch(() => null)
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-white">
      {/* Org header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{org.name}</h1>
          <p className="text-xs text-gray-400">{slug}</p>
        </div>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Home</a>
      </header>

      {/* Tab navigation */}
      <div className="px-6">
        <Suspense>
          <TabBar tabs={TABS} basePath={`/org/${slug}`} />
        </Suspense>
      </div>

      {/* Tab content placeholder — tab components wired in next task */}
      <main className="px-6 py-6">
        <p className="text-sm text-gray-400">Tab: {tab} — loading…</p>
      </main>
    </div>
  )
}
