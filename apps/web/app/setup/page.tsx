'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useCallback, Suspense } from 'react'
import { signIn, useSession } from '@/lib/auth-client'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupWizard />
    </Suspense>
  )
}

function SetupWizard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const step = Number(searchParams.get('step') ?? '0')
  const { data: session } = useSession()

  const [orgName, setOrgName] = useState('')
  const [slug, setSlug] = useState('')
  const [createdSlug, setCreatedSlug] = useState('')
  const [mxTarget, setMxTarget] = useState('')
  const [createdDomainId, setCreatedDomainId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  const createOrg = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        const org = await authedFetch<{ slug: string }>('/v1/orgs', {
          method: 'POST',
          body: JSON.stringify({ name: orgName, slug }),
        })
        setCreatedSlug(org.slug)
        router.push('/setup?step=2')
      } catch (err) {
        console.error(err)
      }
    },
    [orgName, slug, router],
  )

  const setupDomain = useCallback(async () => {
    try {
      const cfg = await authedFetch<{ appDomain: string; mxTarget: string }>('/v1/config')
      const domain = await authedFetch<{ id: string; instructions: string }>(
        `/v1/orgs/${createdSlug}/domains`,
        { method: 'POST', body: JSON.stringify({ domain: cfg.appDomain }) },
      )
      setMxTarget(cfg.mxTarget)
      setCreatedDomainId(domain.id)
      router.push('/setup?step=3')
    } catch (err) {
      console.error(err)
    }
  }, [createdSlug, router])

  const checkVerification = useCallback(async () => {
    setVerifying(true)
    try {
      await authedFetch(`/v1/orgs/${createdSlug}/domains/${createdDomainId}/verify`)
      setVerified(true)
      setTimeout(() => router.push('/setup?step=4'), 1500)
    } catch {
      setVerifying(false)
    }
  }, [createdSlug, createdDomainId, router])

  // Step 0: sign in first
  if (!session?.user) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Welcome</h1>
        <p className="text-sm text-gray-500">Sign in to set up your instance</p>
        <Button
          variant="yellow"
          className="w-full"
          onClick={() => signIn.social({ provider: 'google', callbackURL: '/setup?step=1' })}
        >
          Sign in with Google
        </Button>
      </div>
    )
  }

  // Step 1: create org
  if (step <= 1) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Step 1 of 3</p>
        <h2 className="text-lg font-bold text-gray-900">Create your workspace</h2>
        <form onSubmit={createOrg} className="space-y-3">
          <Input
            value={orgName}
            onChange={e => { setOrgName(e.target.value); setSlug(toSlug(e.target.value)) }}
            placeholder="Organisation name"
            required
          />
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug" required />
          <Button type="submit" variant="yellow" className="w-full">Create & continue</Button>
        </form>
      </div>
    )
  }

  // Step 2: MX instructions
  if (step === 2) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Step 2 of 3</p>
        <h2 className="text-lg font-bold text-gray-900">Configure mail routing</h2>
        <p className="text-sm text-gray-600">Add an MX record at your DNS provider to receive email.</p>
        <Button variant="yellow" className="w-full" onClick={setupDomain}>Generate MX instructions</Button>
        <Button variant="outline" className="w-full" onClick={() => router.push('/setup?step=4')}>Skip for now</Button>
      </div>
    )
  }

  // Step 3: verify DNS
  if (step === 3) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Step 3 of 3</p>
        <h2 className="text-lg font-bold text-gray-900">Verify DNS</h2>
        {mxTarget && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700">
            MX → {mxTarget} (priority 10)
          </div>
        )}
        {verified ? (
          <p className="text-green-600 text-sm font-medium">✓ DNS verified! Redirecting…</p>
        ) : (
          <Button variant="yellow" className="w-full" onClick={checkVerification} disabled={verifying}>
            {verifying ? 'Checking…' : 'Check DNS now'}
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => router.push('/setup?step=4')}>Skip</Button>
      </div>
    )
  }

  // Step 4: complete
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
      <div className="text-4xl">🎉</div>
      <h2 className="text-lg font-bold text-gray-900">You&apos;re all set!</h2>
      <p className="text-sm text-gray-500">Your instance is ready.</p>
      <Button variant="yellow" className="w-full" onClick={() => router.push(`/org/${createdSlug}`)}>
        Go to dashboard
      </Button>
    </div>
  )
}
