import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const res = await fetch(`${API_BASE}/v1/auth/get-session`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  })

  if (!res.ok) redirect('/login')
  const session = await res.json()
  if (!session?.user) redirect('/login')

  // If user belongs to a different org, redirect them there
  if (session.user.orgSlug && session.user.orgSlug !== slug) {
    redirect(`/org/${session.user.orgSlug}`)
  }

  return <>{children}</>
}
