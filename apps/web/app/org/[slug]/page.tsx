import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { TabBar } from '@/components/ui/tabs'
import { serverFetch } from '@/lib/api'
import { getWebConfig } from '@/lib/app-config'
import InboxesTab from '@/components/org/InboxesTab'
import DomainsTab from '@/components/org/DomainsTab'
import CategoriesTab from '@/components/org/CategoriesTab'
import MembersTab from '@/components/org/MembersTab'
import SettingsTab from '@/components/org/SettingsTab'

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
  const { isSaas } = getWebConfig()

  const [org, inboxes] = await Promise.all([
    serverFetch<any>(`/v1/orgs/${slug}`, cookieHeader).catch(() => null),
    tab === 'inboxes'
      ? serverFetch<any[]>(`/v1/orgs/${slug}/inboxes`, cookieHeader).catch(() => [])
      : Promise.resolve([]),
  ])

  if (!org) notFound()

  const currentUserRole = org.currentUserRole ?? 'member'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{org.name}</h1>
          <p className="text-xs text-gray-400">{slug}</p>
        </div>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Home</a>
      </header>

      <div className="px-6">
        <Suspense>
          <TabBar tabs={TABS} basePath={`/org/${slug}`} />
        </Suspense>
      </div>

      <main className="px-6 py-6">
        <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
          {tab === 'inboxes' && <InboxesTab slug={slug} initialInboxes={inboxes ?? []} />}
          {tab === 'categories' && <CategoriesTab slug={slug} />}
          {tab === 'members' && <MembersTab slug={slug} currentUserRole={currentUserRole} />}
          {tab === 'domains' && <DomainsTab slug={slug} />}
          {tab === 'settings' && <SettingsTab slug={slug} org={org} isSaas={isSaas} />}
        </Suspense>
      </main>
    </div>
  )
}
