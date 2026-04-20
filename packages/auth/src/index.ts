import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Db } from '@rawmail/db'
import * as schema from '@rawmail/db'

export function createAuth(db: Db) {
  const auth = betterAuth({
    database: drizzleAdapter(db as never, { provider: 'pg', schema: schema as never }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
    },
    callbacks: {
      async session({ session, user }: any) {
        return { ...session, user: { ...session.user, id: user.id } }
      },
    },
  })

  return auth
}

export type Auth = ReturnType<typeof createAuth>
