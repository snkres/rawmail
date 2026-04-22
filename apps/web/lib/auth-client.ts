import { createAuthClient } from 'better-auth/react'

const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')

export const { signIn, signOut, useSession } = createAuthClient({
  baseURL: API_BASE,
})
