import { apiFetch } from '@/lib/api'
import SignInCard from '@/components/SignInCard'

interface DeployConfig {
  appName: string
  authProvider: 'google' | 'google-hd' | 'oidc'
  allowedEmailDomain: string | null
}

export default async function SignInPage() {
  const cfg = await apiFetch<DeployConfig>('/v1/config').catch(() => ({
    appName: 'rawmail',
    authProvider: 'google' as const,
    allowedEmailDomain: null,
  }))
  return <SignInCard config={cfg} />
}
