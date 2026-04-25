'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Tab {
  id: string
  label: string
}

export function TabBar({ tabs, basePath }: { tabs: Tab[]; basePath: string }) {
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? tabs[0].id

  return (
    <div className="border-b border-gray-200 flex">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={`${basePath}?tab=${tab.id}`}
          className={[
            'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            active === tab.id
              ? 'border-brand-yellow text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900',
          ].join(' ')}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
