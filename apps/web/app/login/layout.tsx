import { redirect } from 'next/navigation'
import { getWebConfig } from '@/lib/app-config'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  const { isSaas } = getWebConfig()
  if (!isSaas) redirect('/sign-in')
  return <>{children}</>
}
