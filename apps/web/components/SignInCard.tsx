'use client'
import { signIn } from '@/lib/auth-client'

interface Props {
  config: {
    appName: string
    authProvider: string
    allowedEmailDomain: string | null
  }
}

export default function SignInCard({ config }: Props) {
  const { appName, authProvider, allowedEmailDomain } = config

  async function handleSignIn() {
    const provider = authProvider === 'oidc' ? 'oidc' : 'google'
    await signIn.social({ provider, callbackURL: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{appName}</h1>
        {allowedEmailDomain && (
          <p className="text-sm text-gray-500 mb-6">
            Sign in with your <span className="font-medium">@{allowedEmailDomain}</span> account
          </p>
        )}
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {authProvider === 'oidc' ? 'Continue with SSO' : 'Continue with Google'}
        </button>
      </div>
    </div>
  )
}
