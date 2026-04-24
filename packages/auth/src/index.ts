import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import type { Db } from '@rawmail/db'
import * as schema from '@rawmail/db'
import { getConfig } from '@rawmail/config'

export function createAuth(db: Db) {
  const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'
  const webURL = process.env.WEB_URL ?? 'http://localhost:3000'

  const auth = betterAuth({
    baseURL,
    trustedOrigins: [webURL, 'http://localhost:3000', 'http://localhost:3001'],
    database: drizzleAdapter(db as never, { provider: 'pg', schema: schema as never }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
    },
    callbacks: {
      async session({ session, user }: any) {
        let orgSlug: string | null = null
        if (user.orgId) {
          const org = await db.query.orgs.findFirst({
            where: eq(schema.orgs.id, user.orgId),
          })
          orgSlug = org?.slug ?? null
        }
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            orgId: user.orgId ?? null,
            orgSlug,
            role: user.role ?? 'member',
          },
        }
      },
      async signIn({ user }: any) {
        const cfg = getConfig()
        if (!cfg.isSaas && cfg.allowedEmailDomain && !cfg.isOidcConfigured()) {
          const domain = user.email?.split('@')[1]
          if (domain !== cfg.allowedEmailDomain) {
            throw new Error(`Sign-in restricted to @${cfg.allowedEmailDomain}`)
          }
        }
        return true
      },
    },
  })

  return auth
}

export type Auth = ReturnType<typeof createAuth>
