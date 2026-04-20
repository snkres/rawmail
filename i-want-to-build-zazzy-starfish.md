# rawmail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build rawmail — a secure disposable email service with org SSO, custom domains, and a developer API, deployed via Docker Compose.

**Architecture:** Turborepo monorepo with Next.js (web), Fastify (API + SSE), and Haraka (SMTP). PostgreSQL stores all data; Redis bridges Haraka → Fastify for real-time SSE delivery. Better-auth handles Google OAuth; Stripe handles billing.

**Tech Stack:** pnpm + Turborepo, Next.js 15, Fastify 5, Haraka, Drizzle ORM, PostgreSQL 16, Redis 7, Better-auth, Stripe, Vitest, Docker Compose, Caddy

---

## File Map

```
rawmail/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts                  # Fastify entry + buildApp()
│   │   │   ├── plugins/
│   │   │   │   ├── db.ts                 # Drizzle fastify-plugin
│   │   │   │   ├── redis.ts              # ioredis fastify-plugin
│   │   │   │   └── rate-limit.ts         # @fastify/rate-limit config
│   │   │   ├── routes/
│   │   │   │   ├── inboxes.ts            # GET/POST/DELETE/PUT inbox routes
│   │   │   │   ├── messages.ts           # GET/DELETE message routes
│   │   │   │   ├── stream.ts             # SSE /inboxes/:address/stream
│   │   │   │   ├── orgs.ts               # Org CRUD (Phase 3)
│   │   │   │   ├── categories.ts         # Category CRUD (Phase 4)
│   │   │   │   ├── domains.ts            # Custom domain routes (Phase 4)
│   │   │   │   ├── members.ts            # Member management (Phase 3)
│   │   │   │   └── billing.ts            # Stripe routes (Phase 5)
│   │   │   └── services/
│   │   │       ├── inbox.service.ts      # InboxService class
│   │   │       ├── message.service.ts    # MessageService class
│   │   │       ├── ttl.service.ts        # TTL cron job
│   │   │       ├── org.service.ts        # OrgService (Phase 3)
│   │   │       ├── domain.service.ts     # DNS polling (Phase 4)
│   │   │       └── billing.service.ts    # Stripe logic (Phase 5)
│   │   ├── test/
│   │   │   ├── inbox.service.test.ts
│   │   │   ├── message.service.test.ts
│   │   │   ├── inboxes.route.test.ts
│   │   │   ├── messages.route.test.ts
│   │   │   └── stream.route.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── mail/
│   │   ├── plugins/
│   │   │   ├── rawmail-validate.js       # rcpt hook — domain check
│   │   │   ├── rawmail-sanitize.js       # data_post hook — pixel strip
│   │   │   └── rawmail-queue.js          # queue hook — DB write + Redis pub
│   │   ├── test/
│   │   │   ├── rawmail-validate.test.js
│   │   │   ├── rawmail-sanitize.test.js
│   │   │   └── rawmail-queue.test.js
│   │   ├── config.yaml
│   │   ├── package.json
│   │   └── vitest.config.js
│   └── web/
│       ├── app/
│       │   ├── page.tsx                  # Landing page (Phase 2)
│       │   ├── layout.tsx
│       │   ├── inbox/
│       │   │   └── [address]/
│       │   │       └── page.tsx          # Inbox view (Phase 2)
│       │   └── org/
│       │       └── [slug]/
│       │           └── page.tsx          # Org dashboard (Phase 3)
│       ├── components/
│       │   ├── InboxInput.tsx            # Address entry (Phase 2)
│       │   ├── MessageList.tsx           # SSE-driven list (Phase 2)
│       │   ├── MessageDetail.tsx         # Email render (Phase 2)
│       │   └── ClaimModal.tsx            # Claim inbox (Phase 2)
│       ├── lib/
│       │   ├── api.ts                    # Typed fetch wrapper
│       │   └── sse.ts                    # SSE client hook
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema.ts                 # All Drizzle table definitions
│   │   │   └── index.ts                  # createDb() + re-exports
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── auth/
│   │   ├── src/
│   │   │   └── index.ts                  # Better-auth config (Phase 3)
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── sdk/
│   │   ├── src/
│   │   │   ├── client.ts                 # RawmailClient class (Phase 6)
│   │   │   ├── inboxes.ts                # inboxes namespace
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       │   ├── schemas/
│       │   │   ├── inbox.ts              # Zod InboxSchema
│       │   │   └── message.ts            # Zod MessageSchema
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── Caddyfile
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Phase 1 — Core Email Engine

### Task 1: Monorepo Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `package.json` (root)
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/mail/package.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "rawmail",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": { "node": ">=20", "pnpm": ">=9" }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "persistent": true, "cache": false },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

- [ ] **Step 4: Create packages/shared/package.json**

```json
{
  "name": "@rawmail/shared",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "build": "tsc", "lint": "tsc --noEmit" },
  "dependencies": { "zod": "^3.22.0" },
  "devDependencies": { "typescript": "^5.4.0" }
}
```

- [ ] **Step 5: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create packages/db/package.json**

```json
{
  "name": "@rawmail/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.21.0",
    "@types/pg": "^8.11.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Create packages/db/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create apps/api/package.json**

```json
{
  "name": "@rawmail/api",
  "version": "0.0.1",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@rawmail/db": "workspace:*",
    "@rawmail/shared": "workspace:*",
    "@fastify/rate-limit": "^9.0.0",
    "bcrypt": "^5.1.0",
    "fastify": "^5.0.0",
    "fastify-plugin": "^5.0.0",
    "ioredis": "^5.3.0",
    "node-cron": "^3.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 9: Create apps/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 10: Create apps/mail/package.json**

```json
{
  "name": "@rawmail/mail",
  "version": "0.0.1",
  "scripts": {
    "start": "haraka -c .",
    "test": "vitest run"
  },
  "dependencies": {
    "haraka": "^3.0.0",
    "ioredis": "^5.3.0",
    "mailparser": "^3.6.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 11: Install all dependencies**

```bash
cd /path/to/rawmail && pnpm install
```

Expected: all packages installed, no errors.

- [ ] **Step 12: Commit**

```bash
git init
git add .
git commit -m "feat: monorepo scaffold — turborepo, pnpm workspaces, package configs"
```

---

### Task 2: Database Schema

**Files:**
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/drizzle.config.ts`

- [ ] **Step 1: Create packages/db/src/schema.ts**

```typescript
import {
  pgTable, uuid, text, boolean, timestamp, integer
} from 'drizzle-orm/pg-core'

export const orgs = pgTable('orgs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ssoDomain: text('sso_domain'),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  orgId: uuid('org_id').references(() => orgs.id),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => orgs.id),
  domain: text('domain').notNull().unique(),
  mxVerified: boolean('mx_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => orgs.id),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const inboxes = pgTable('inboxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(),
  tokenHash: text('token_hash'),
  orgId: uuid('org_id').references(() => orgs.id),
  categoryId: uuid('category_id').references(() => categories.id),
  ttlExpiresAt: timestamp('ttl_expires_at').notNull(),
  isClaimed: boolean('is_claimed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  inboxId: uuid('inbox_id').notNull().references(() => inboxes.id, { onDelete: 'cascade' }),
  fromAddress: text('from_address').notNull(),
  subject: text('subject').notNull().default(''),
  htmlBody: text('html_body').notNull().default(''),
  textBody: text('text_body').notNull().default(''),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  storagePath: text('storage_path').notNull(),
  size: integer('size').notNull(),
})
```

- [ ] **Step 2: Create packages/db/src/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
export * from './schema'
```

- [ ] **Step 3: Create packages/db/drizzle.config.ts**

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

- [ ] **Step 4: Generate migration**

```bash
cd packages/db && pnpm db:generate
```

Expected: `migrations/0000_initial.sql` created with CREATE TABLE statements for all 7 tables.

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "feat: drizzle schema — all 7 tables with migrations"
```

---

### Task 3: Shared Zod Schemas

**Files:**
- Create: `packages/shared/src/schemas/inbox.ts`
- Create: `packages/shared/src/schemas/message.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create packages/shared/src/schemas/inbox.ts**

```typescript
import { z } from 'zod'

export const InboxSchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  isClaimed: z.boolean(),
  ttlExpiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})

export const ClaimResponseSchema = z.object({
  token: z.string().length(64),
  inbox: InboxSchema,
})

export type Inbox = z.infer<typeof InboxSchema>
export type ClaimResponse = z.infer<typeof ClaimResponseSchema>
```

- [ ] **Step 2: Create packages/shared/src/schemas/message.ts**

```typescript
import { z } from 'zod'

export const MessageSchema = z.object({
  id: z.string().uuid(),
  inboxId: z.string().uuid(),
  fromAddress: z.string(),
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string(),
  receivedAt: z.string().datetime(),
})

export type Message = z.infer<typeof MessageSchema>
```

- [ ] **Step 3: Create packages/shared/src/index.ts**

```typescript
export * from './schemas/inbox'
export * from './schemas/message'
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared
git commit -m "feat: shared zod schemas for inbox and message"
```

---

### Task 4: Fastify App + Plugins

**Files:**
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/plugins/db.ts`
- Create: `apps/api/src/plugins/redis.ts`
- Create: `apps/api/src/plugins/rate-limit.ts`
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Create apps/api/src/plugins/db.ts**

```typescript
import fp from 'fastify-plugin'
import { createDb, type Db } from '@rawmail/db'

declare module 'fastify' {
  interface FastifyInstance { db: Db }
}

export const dbPlugin = fp(async (app) => {
  app.decorate('db', createDb(process.env.DATABASE_URL!))
})
```

- [ ] **Step 2: Create apps/api/src/plugins/redis.ts**

```typescript
import fp from 'fastify-plugin'
import { Redis } from 'ioredis'

declare module 'fastify' {
  interface FastifyInstance { redis: Redis }
}

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(process.env.REDIS_URL!)
  app.decorate('redis', redis)
  app.addHook('onClose', async () => redis.quit())
})
```

- [ ] **Step 3: Create apps/api/src/plugins/rate-limit.ts**

```typescript
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  })
})
```

- [ ] **Step 4: Create apps/api/src/index.ts**

```typescript
import Fastify from 'fastify'
import { dbPlugin } from './plugins/db'
import { redisPlugin } from './plugins/redis'
import { rateLimitPlugin } from './plugins/rate-limit'
import { inboxRoutes } from './routes/inboxes'
import { messageRoutes } from './routes/messages'
import { streamRoutes } from './routes/stream'

export function buildApp(opts: Parameters<typeof Fastify>[0] = {}) {
  const app = Fastify({ logger: true, ...opts })
  app.register(dbPlugin)
  app.register(redisPlugin)
  app.register(rateLimitPlugin)
  app.register(inboxRoutes, { prefix: '/v1/inboxes' })
  app.register(messageRoutes, { prefix: '/v1/messages' })
  app.register(streamRoutes, { prefix: '/v1/inboxes' })
  return app
}

if (process.env.NODE_ENV !== 'test') {
  const app = buildApp()
  app.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
    if (err) { app.log.error(err); process.exit(1) }
  })
}
```

- [ ] **Step 5: Create apps/api/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src apps/api/vitest.config.ts
git commit -m "feat: fastify app scaffold with db, redis, rate-limit plugins"
```

---

### Task 5: InboxService + Tests

**Files:**
- Create: `apps/api/src/services/inbox.service.ts`
- Create: `apps/api/test/inbox.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/test/inbox.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InboxService } from '../src/services/inbox.service'

function makeMockDb() {
  const rows: Record<string, any> = {}
  return {
    query: {
      inboxes: {
        findFirst: vi.fn(async ({ where }: any) => null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: false, tokenHash: null, ttlExpiresAt: new Date(Date.now() + 7 * 86400_000), createdAt: new Date() }]) })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: true, tokenHash: 'hashed', ttlExpiresAt: new Date(), createdAt: new Date() }]) })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({ returning: vi.fn(async () => []) })),
    })),
  } as any
}

describe('InboxService', () => {
  let db: ReturnType<typeof makeMockDb>
  let service: InboxService

  beforeEach(() => {
    db = makeMockDb()
    service = new InboxService(db)
  })

  it('getOrCreate returns existing inbox', async () => {
    const existing = { id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: false }
    db.query.inboxes.findFirst.mockResolvedValue(existing)
    const result = await service.getOrCreate('test@rawmail.sh')
    expect(result).toBe(existing)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('getOrCreate creates new inbox when not found', async () => {
    db.query.inboxes.findFirst.mockResolvedValue(null)
    const result = await service.getOrCreate('new@rawmail.sh')
    expect(db.insert).toHaveBeenCalled()
    expect(result.address).toBe('test@rawmail.sh')
  })

  it('claim throws if inbox already claimed', async () => {
    db.query.inboxes.findFirst.mockResolvedValue({ id: 'inbox-1', isClaimed: true })
    await expect(service.claim('test@rawmail.sh')).rejects.toThrow('already claimed')
  })

  it('claim returns token and updates inbox', async () => {
    db.query.inboxes.findFirst.mockResolvedValue({ id: 'inbox-1', isClaimed: false, tokenHash: null })
    const result = await service.claim('test@rawmail.sh')
    expect(result.token).toHaveLength(64)
    expect(db.update).toHaveBeenCalled()
  })

  it('deleteExpired removes inboxes past TTL', async () => {
    await service.deleteExpired()
    expect(db.delete).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/api && pnpm test test/inbox.service.test.ts
```

Expected: FAIL — `InboxService` not found.

- [ ] **Step 3: Create apps/api/src/services/inbox.service.ts**

```typescript
import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import { eq, lt } from 'drizzle-orm'
import { inboxes, type Db } from '@rawmail/db'

const FREE_TTL_DAYS = 7

export class InboxService {
  constructor(private db: Db) {}

  async getOrCreate(address: string) {
    const existing = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (existing) return existing

    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + FREE_TTL_DAYS)

    const [inbox] = await this.db.insert(inboxes)
      .values({ address, ttlExpiresAt })
      .returning()
    return inbox
  }

  async claim(address: string) {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox) throw new Error('Inbox not found')
    if (inbox.isClaimed) throw new Error('Inbox already claimed')

    const token = randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(token, 10)

    const [updated] = await this.db.update(inboxes)
      .set({ tokenHash, isClaimed: true })
      .where(eq(inboxes.address, address))
      .returning()

    return { token, inbox: updated }
  }

  async verifyToken(address: string, token: string): Promise<boolean> {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox?.tokenHash) return false
    return bcrypt.compare(token, inbox.tokenHash)
  }

  async delete(address: string) {
    await this.db.delete(inboxes).where(eq(inboxes.address, address))
  }

  async extendTtl(address: string, days: number) {
    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + days)
    const [updated] = await this.db.update(inboxes)
      .set({ ttlExpiresAt })
      .where(eq(inboxes.address, address))
      .returning()
    return updated
  }

  async deleteExpired(): Promise<number> {
    const deleted = await this.db.delete(inboxes)
      .where(lt(inboxes.ttlExpiresAt, new Date()))
      .returning()
    return deleted.length
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/api && pnpm test test/inbox.service.test.ts
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/inbox.service.ts apps/api/test/inbox.service.test.ts
git commit -m "feat: InboxService — getOrCreate, claim, verifyToken, delete, deleteExpired"
```

---

### Task 6: MessageService + Tests

**Files:**
- Create: `apps/api/src/services/message.service.ts`
- Create: `apps/api/test/message.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/test/message.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageService } from '../src/services/message.service'

function makeMockDb() {
  return {
    query: {
      inboxes: {
        findFirst: vi.fn(async () => ({ id: 'inbox-1', address: 'test@rawmail.sh' })),
      },
      messages: {
        findMany: vi.fn(async () => [
          { id: 'msg-1', inboxId: 'inbox-1', fromAddress: 'from@example.com', subject: 'Hello', htmlBody: '<p>hi</p>', textBody: 'hi', receivedAt: new Date() },
        ]),
        findFirst: vi.fn(async () => ({ id: 'msg-1', inboxId: 'inbox-1' })),
      },
    },
    delete: vi.fn(() => ({ where: vi.fn(async () => []) })),
  } as any
}

describe('MessageService', () => {
  let db: ReturnType<typeof makeMockDb>
  let service: MessageService

  beforeEach(() => {
    db = makeMockDb()
    service = new MessageService(db)
  })

  it('listByInbox returns empty array when inbox not found', async () => {
    db.query.inboxes.findFirst.mockResolvedValue(null)
    const result = await service.listByInbox('missing@rawmail.sh')
    expect(result).toEqual([])
  })

  it('listByInbox returns messages for known inbox', async () => {
    const result = await service.listByInbox('test@rawmail.sh')
    expect(result).toHaveLength(1)
    expect(result[0].subject).toBe('Hello')
  })

  it('getById returns message by id', async () => {
    const result = await service.getById('msg-1')
    expect(result?.id).toBe('msg-1')
  })

  it('delete calls db.delete', async () => {
    await service.delete('msg-1')
    expect(db.delete).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/api && pnpm test test/message.service.test.ts
```

Expected: FAIL — `MessageService` not found.

- [ ] **Step 3: Create apps/api/src/services/message.service.ts**

```typescript
import { eq } from 'drizzle-orm'
import { inboxes, messages, type Db } from '@rawmail/db'

export class MessageService {
  constructor(private db: Db) {}

  async listByInbox(address: string) {
    const inbox = await this.db.query.inboxes.findFirst({
      where: eq(inboxes.address, address),
    })
    if (!inbox) return []

    return this.db.query.messages.findMany({
      where: eq(messages.inboxId, inbox.id),
      orderBy: (m, { desc }) => [desc(m.receivedAt)],
    })
  }

  async getById(id: string) {
    return this.db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { attachments: true },
    })
  }

  async delete(id: string) {
    await this.db.delete(messages).where(eq(messages.id, id))
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/api && pnpm test test/message.service.test.ts
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/message.service.ts apps/api/test/message.service.test.ts
git commit -m "feat: MessageService — listByInbox, getById, delete"
```

---

### Task 7: Inbox Routes + Tests

**Files:**
- Create: `apps/api/src/routes/inboxes.ts`
- Create: `apps/api/test/inboxes.route.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `apps/api/test/inboxes.route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { inboxRoutes } from '../src/routes/inboxes'

function buildTestApp() {
  const app = Fastify({ logger: false })

  const mockInboxService = {
    getOrCreate: vi.fn(async (addr: string) => ({
      id: 'inbox-1', address: addr, isClaimed: false,
      ttlExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
      createdAt: new Date().toISOString(),
    })),
    claim: vi.fn(async () => ({
      token: 'a'.repeat(64),
      inbox: { id: 'inbox-1', address: 'test@rawmail.sh', isClaimed: true },
    })),
    verifyToken: vi.fn(async () => true),
    delete: vi.fn(async () => {}),
    extendTtl: vi.fn(async (addr: string, days: number) => ({
      id: 'inbox-1', address: addr, ttlExpiresAt: new Date().toISOString(),
    })),
  }

  app.decorate('db', {} as any)
  app.decorate('redis', {} as any)

  app.register(inboxRoutes, { prefix: '/v1/inboxes', inboxService: mockInboxService as any })

  return { app, mockInboxService }
}

describe('GET /v1/inboxes/:address', () => {
  it('returns inbox', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/v1/inboxes/test@rawmail.sh' })
    expect(res.statusCode).toBe(200)
    expect(res.json().address).toBe('test@rawmail.sh')
  })
})

describe('POST /v1/inboxes/:address/claim', () => {
  it('returns token', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'POST', url: '/v1/inboxes/test@rawmail.sh/claim' })
    expect(res.statusCode).toBe(201)
    expect(res.json().token).toHaveLength(64)
  })
})

describe('DELETE /v1/inboxes/:address', () => {
  it('returns 401 without token', async () => {
    const { app, mockInboxService } = buildTestApp()
    mockInboxService.verifyToken.mockResolvedValue(false)
    const res = await app.inject({ method: 'DELETE', url: '/v1/inboxes/test@rawmail.sh' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 204 with valid token', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/inboxes/test@rawmail.sh',
      headers: { 'x-inbox-token': 'valid-token' },
    })
    expect(res.statusCode).toBe(204)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/api && pnpm test test/inboxes.route.test.ts
```

Expected: FAIL — `inboxRoutes` not found.

- [ ] **Step 3: Create apps/api/src/routes/inboxes.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { InboxService } from '../services/inbox.service'
import { MessageService } from '../services/message.service'

interface InboxRoutesOpts {
  inboxService?: InboxService
}

export const inboxRoutes: FastifyPluginAsync<InboxRoutesOpts> = async (app, opts) => {
  const inboxService = opts.inboxService ?? new InboxService(app.db)
  const messageService = new MessageService(app.db)

  app.get<{ Params: { address: string } }>('/:address', async (req) => {
    return inboxService.getOrCreate(req.params.address)
  })

  app.get<{ Params: { address: string } }>('/:address/messages', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined
    const inbox = await inboxService.getOrCreate(address)

    if (inbox.isClaimed) {
      if (!token || !(await inboxService.verifyToken(address, token))) {
        return reply.code(401).send({ error: 'Invalid token' })
      }
    }

    return messageService.listByInbox(address)
  })

  app.post<{ Params: { address: string } }>('/:address/claim', async (req, reply) => {
    const result = await inboxService.claim(req.params.address)
    return reply.code(201).send(result)
  })

  app.delete<{ Params: { address: string } }>('/:address', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined
    if (!token || !(await inboxService.verifyToken(address, token))) {
      return reply.code(401).send({ error: 'Invalid token' })
    }
    await inboxService.delete(address)
    return reply.code(204).send()
  })

  app.put<{ Params: { address: string }; Body: { days: number } }>('/:address/ttl', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined
    if (!token || !(await inboxService.verifyToken(address, token))) {
      return reply.code(401).send({ error: 'Invalid token' })
    }
    return inboxService.extendTtl(address, req.body.days)
  })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd apps/api && pnpm test test/inboxes.route.test.ts
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/inboxes.ts apps/api/test/inboxes.route.test.ts
git commit -m "feat: inbox routes — GET, GET messages, POST claim, DELETE, PUT ttl"
```

---

### Task 8: Message Routes + Tests

**Files:**
- Create: `apps/api/src/routes/messages.ts`
- Create: `apps/api/test/messages.route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/test/messages.route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { messageRoutes } from '../src/routes/messages'

function buildTestApp() {
  const app = Fastify({ logger: false })
  const mockService = {
    getById: vi.fn(async (id: string) => ({ id, inboxId: 'inbox-1', subject: 'Test', htmlBody: '<p>hi</p>', textBody: 'hi', fromAddress: 'a@b.com', receivedAt: new Date().toISOString() })),
    delete: vi.fn(async () => {}),
  }
  app.decorate('db', {} as any)
  app.register(messageRoutes, { prefix: '/v1/messages', messageService: mockService as any })
  return { app, mockService }
}

describe('GET /v1/messages/:id', () => {
  it('returns message', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'GET', url: '/v1/messages/msg-1' })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe('msg-1')
  })

  it('returns 404 when not found', async () => {
    const { app, mockService } = buildTestApp()
    mockService.getById.mockResolvedValue(null)
    const res = await app.inject({ method: 'GET', url: '/v1/messages/missing' })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /v1/messages/:id', () => {
  it('returns 204', async () => {
    const { app } = buildTestApp()
    const res = await app.inject({ method: 'DELETE', url: '/v1/messages/msg-1' })
    expect(res.statusCode).toBe(204)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd apps/api && pnpm test test/messages.route.test.ts
```

Expected: FAIL — `messageRoutes` not found.

- [ ] **Step 3: Create apps/api/src/routes/messages.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { MessageService } from '../services/message.service'

interface MessageRoutesOpts {
  messageService?: MessageService
}

export const messageRoutes: FastifyPluginAsync<MessageRoutesOpts> = async (app, opts) => {
  const messageService = opts.messageService ?? new MessageService(app.db)

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const message = await messageService.getById(req.params.id)
    if (!message) return reply.code(404).send({ error: 'Not found' })
    return message
  })

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await messageService.delete(req.params.id)
    return reply.code(204).send()
  })
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd apps/api && pnpm test test/messages.route.test.ts
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/messages.ts apps/api/test/messages.route.test.ts
git commit -m "feat: message routes — GET by id, DELETE"
```

---

### Task 9: SSE Stream Route + Tests

**Files:**
- Create: `apps/api/src/routes/stream.ts`
- Create: `apps/api/test/stream.route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/test/stream.route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import Fastify from 'fastify'
import { streamRoutes } from '../src/routes/stream'

function buildTestApp(isClaimed = false, tokenValid = true) {
  const app = Fastify({ logger: false })

  const mockInboxService = {
    getOrCreate: vi.fn(async (addr: string) => ({ id: 'inbox-1', address: addr, isClaimed })),
    verifyToken: vi.fn(async () => tokenValid),
  }

  const mockRedis = {
    duplicate: vi.fn(() => ({
      subscribe: vi.fn(async () => {}),
      on: vi.fn(),
      quit: vi.fn(async () => {}),
    })),
  }

  app.decorate('db', {} as any)
  app.decorate('redis', mockRedis as any)
  app.register(streamRoutes, { prefix: '/v1/inboxes', inboxService: mockInboxService as any })
  return { app, mockInboxService }
}

describe('GET /v1/inboxes/:address/stream', () => {
  it('opens SSE stream for anonymous inbox', async () => {
    const { app } = buildTestApp(false)
    const res = await app.inject({ method: 'GET', url: '/v1/inboxes/test@rawmail.sh/stream' })
    expect(res.headers['content-type']).toContain('text/event-stream')
  })

  it('returns 401 for claimed inbox without token', async () => {
    const { app } = buildTestApp(true, false)
    const res = await app.inject({ method: 'GET', url: '/v1/inboxes/test@rawmail.sh/stream' })
    expect(res.statusCode).toBe(401)
  })

  it('opens stream for claimed inbox with valid token', async () => {
    const { app } = buildTestApp(true, true)
    const res = await app.inject({
      method: 'GET',
      url: '/v1/inboxes/test@rawmail.sh/stream',
      headers: { 'x-inbox-token': 'valid-token' },
    })
    expect(res.headers['content-type']).toContain('text/event-stream')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd apps/api && pnpm test test/stream.route.test.ts
```

Expected: FAIL — `streamRoutes` not found.

- [ ] **Step 3: Create apps/api/src/routes/stream.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { InboxService } from '../services/inbox.service'

interface StreamRoutesOpts {
  inboxService?: InboxService
}

export const streamRoutes: FastifyPluginAsync<StreamRoutesOpts> = async (app, opts) => {
  const inboxService = opts.inboxService ?? new InboxService(app.db)

  app.get<{ Params: { address: string } }>('/:address/stream', async (req, reply) => {
    const { address } = req.params
    const token = req.headers['x-inbox-token'] as string | undefined

    const inbox = await inboxService.getOrCreate(address)
    if (inbox.isClaimed) {
      if (!token || !(await inboxService.verifyToken(address, token))) {
        return reply.code(401).send({ error: 'Invalid token' })
      }
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    reply.raw.flushHeaders()

    const subscriber = app.redis.duplicate()
    await subscriber.subscribe(`inbox:${address}`)

    subscriber.on('message', (_channel: string, data: string) => {
      reply.raw.write(`data: ${data}\n\n`)
    })

    const ping = setInterval(() => reply.raw.write(':ping\n\n'), 25000)

    req.raw.on('close', () => {
      clearInterval(ping)
      subscriber.quit()
    })
  })
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd apps/api && pnpm test test/stream.route.test.ts
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/stream.ts apps/api/test/stream.route.test.ts
git commit -m "feat: SSE stream route — real-time inbox delivery via Redis pub/sub"
```

---

### Task 10: TTL Cron Job

**Files:**
- Create: `apps/api/src/services/ttl.service.ts`

- [ ] **Step 1: Create apps/api/src/services/ttl.service.ts**

```typescript
import cron from 'node-cron'
import type { InboxService } from './inbox.service'

export function startTtlCron(inboxService: InboxService) {
  return cron.schedule('0 * * * *', async () => {
    const count = await inboxService.deleteExpired()
    if (count > 0) {
      console.log(`[ttl-cron] Purged ${count} expired inboxes`)
    }
  })
}
```

- [ ] **Step 2: Wire cron into apps/api/src/index.ts**

Add after plugin registrations:

```typescript
import { startTtlCron } from './services/ttl.service'
import { InboxService } from './services/inbox.service'

// after app.register calls:
app.addHook('onReady', async () => {
  startTtlCron(new InboxService(app.db))
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/ttl.service.ts apps/api/src/index.ts
git commit -m "feat: TTL cron — purge expired inboxes hourly"
```

---

### Task 11: Haraka Plugins

**Files:**
- Create: `apps/mail/plugins/rawmail-validate.js`
- Create: `apps/mail/plugins/rawmail-sanitize.js`
- Create: `apps/mail/plugins/rawmail-queue.js`
- Create: `apps/mail/test/rawmail-sanitize.test.js`
- Create: `apps/mail/test/rawmail-queue.test.js`
- Create: `apps/mail/config.yaml`

- [ ] **Step 1: Write failing sanitize test**

Create `apps/mail/test/rawmail-sanitize.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { stripTrackingPixels } from '../plugins/rawmail-sanitize.js'

describe('stripTrackingPixels', () => {
  it('removes 1x1 tracking pixel img tags', () => {
    const html = '<p>Hello</p><img src="https://track.example.com/open" width="1" height="1">'
    const result = stripTrackingPixels(html)
    expect(result).not.toContain('<img')
    expect(result).toContain('<p>Hello</p>')
  })

  it('removes img tags with width=0', () => {
    const html = '<img src="https://pixel.example.com" width="0" height="0">'
    const result = stripTrackingPixels(html)
    expect(result).not.toContain('<img')
  })

  it('preserves normal images', () => {
    const html = '<img src="https://example.com/logo.png" width="200" height="100">'
    const result = stripTrackingPixels(html)
    expect(result).toContain('<img')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
cd apps/mail && pnpm test test/rawmail-sanitize.test.js
```

Expected: FAIL.

- [ ] **Step 3: Create apps/mail/plugins/rawmail-sanitize.js**

```javascript
'use strict'

export function stripTrackingPixels(html) {
  if (!html) return html
  return html.replace(
    /<img[^>]*(?:width=["']?[01]["']?[^>]*height=["']?[01]["']?|height=["']?[01]["']?[^>]*width=["']?[01]["']?)[^>]*\/?>/gi,
    ''
  )
}

exports.hook_data_post = function (next, connection) {
  const transaction = connection.transaction
  transaction.message_stream.get_data((data) => {
    const html = data.toString()
    const cleaned = stripTrackingPixels(html)
    // Replace only if changed to avoid unnecessary rewriting
    if (cleaned !== html) {
      transaction.notes.sanitizedHtml = cleaned
    }
    next()
  })
}
```

- [ ] **Step 4: Run sanitize test — expect pass**

```bash
cd apps/mail && pnpm test test/rawmail-sanitize.test.js
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Create apps/mail/plugins/rawmail-validate.js**

```javascript
'use strict'

const { Pool } = require('pg')
let pool

exports.register = function () {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  this.logdebug('rawmail-validate registered')
}

exports.hook_rcpt = async function (next, connection, params) {
  const domain = params[0].host.toLowerCase()

  if (domain === (process.env.RAWMAIL_DOMAIN ?? 'rawmail.sh')) {
    return next()
  }

  try {
    const { rows } = await pool.query(
      'SELECT id FROM domains WHERE domain = $1 AND mx_verified = true LIMIT 1',
      [domain]
    )
    if (rows.length > 0) return next()
  } catch (err) {
    connection.logerror(this, `DB error: ${err.message}`)
  }

  return next(DENY, `Unknown domain: ${domain}`)
}

exports.shutdown = async function () {
  await pool?.end()
}
```

- [ ] **Step 6: Create apps/mail/plugins/rawmail-queue.js**

```javascript
'use strict'

const { Pool } = require('pg')
const { Redis } = require('ioredis')
const { simpleParser } = require('mailparser')
const { stripTrackingPixels } = require('./rawmail-sanitize')
const { randomUUID } = require('crypto')

let pool
let redis

exports.register = function () {
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  redis = new Redis(process.env.REDIS_URL)
  this.logdebug('rawmail-queue registered')
}

exports.hook_queue = function (next, connection) {
  const transaction = connection.transaction
  const recipients = transaction.rcpt_to.map((r) => r.address())

  transaction.message_stream.get_data(async (rawData) => {
    try {
      const parsed = await simpleParser(rawData)
      const htmlBody = stripTrackingPixels(parsed.html || '')
      const textBody = parsed.text || ''

      for (const address of recipients) {
        // Upsert inbox
        const inboxResult = await pool.query(
          `INSERT INTO inboxes (id, address, ttl_expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '7 days')
           ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
           RETURNING id`,
          [randomUUID(), address]
        )
        const inboxId = inboxResult.rows[0].id

        // Insert message
        const msgResult = await pool.query(
          `INSERT INTO messages (id, inbox_id, from_address, subject, html_body, text_body)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            randomUUID(),
            inboxId,
            parsed.from?.text ?? '',
            parsed.subject ?? '',
            htmlBody,
            textBody,
          ]
        )
        const messageId = msgResult.rows[0].id

        // Handle attachments
        for (const att of parsed.attachments ?? []) {
          const storagePath = `attachments/${inboxId}/${messageId}/${att.filename}`
          await pool.query(
            `INSERT INTO attachments (id, message_id, filename, content_type, storage_path, size)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), messageId, att.filename, att.contentType, storagePath, att.size]
          )
        }

        // Publish to Redis for SSE
        const payload = JSON.stringify({
          id: messageId,
          inboxId,
          fromAddress: parsed.from?.text ?? '',
          subject: parsed.subject ?? '',
          receivedAt: new Date().toISOString(),
        })
        await redis.publish(`inbox:${address}`, payload)
      }

      next(OK)
    } catch (err) {
      connection.logerror(this, `Queue error: ${err.message}`)
      next(DENYSOFT, 'Temporary error, try again')
    }
  })
}

exports.shutdown = async function () {
  await pool?.end()
  await redis?.quit()
}
```

- [ ] **Step 7: Create apps/mail/config.yaml**

```yaml
me: rawmail.sh
nodes: 1
smtp_port: 25

queue: rawmail-queue
plugins:
  - rawmail-validate
  - rawmail-sanitize
  - rawmail-queue

# Disable default queue plugins
# No logging of connection metadata (privacy)
loglevel: WARN
```

- [ ] **Step 8: Commit**

```bash
git add apps/mail
git commit -m "feat: haraka plugins — validate domain, strip tracking pixels, queue to postgres + redis"
```

---

### Task 12: Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `Caddyfile`
- Create: `.env.example`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.9'

services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [web, api]

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://api:3001}
    depends_on: [api]

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://rawmail:rawmail@postgres:5432/rawmail
      - REDIS_URL=redis://redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  mail:
    build:
      context: .
      dockerfile: apps/mail/Dockerfile
    ports:
      - "25:25"
    environment:
      - DATABASE_URL=postgresql://rawmail:rawmail@postgres:5432/rawmail
      - REDIS_URL=redis://redis:6379
      - RAWMAIL_DOMAIN=${RAWMAIL_DOMAIN:-rawmail.sh}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: rawmail
      POSTGRES_PASSWORD: rawmail
      POSTGRES_DB: rawmail
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rawmail"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  caddy_data:
```

- [ ] **Step 2: Create Caddyfile**

```
rawmail.sh {
  reverse_proxy /v1/* api:3001
  reverse_proxy web:3000
}

attachments.rawmail.sh {
  root * /srv/attachments
  file_server
  header Content-Disposition attachment
  header -Set-Cookie
}
```

- [ ] **Step 3: Create .env.example**

```bash
# Domain
RAWMAIL_DOMAIN=rawmail.sh
NEXT_PUBLIC_API_URL=https://api.rawmail.sh

# Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BETTER_AUTH_SECRET=generate-with-openssl-rand-hex-32

# Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Create apps/api/Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @rawmail/db build
RUN pnpm --filter @rawmail/shared build
RUN pnpm --filter @rawmail/api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

- [ ] **Step 5: Create apps/mail/Dockerfile**

```dockerfile
FROM node:20-alpine
RUN corepack enable pnpm
WORKDIR /app
COPY apps/mail/package.json ./
COPY apps/mail/plugins/ ./plugins/
COPY apps/mail/config.yaml ./
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "start"]
```

- [ ] **Step 6: Run docker compose to verify Phase 1**

```bash
cp .env.example .env  # fill in values
docker compose up -d postgres redis
# Run DB migrations
docker compose run --rm api node -e "require('./dist/migrate')"
docker compose up -d
```

Expected: all services healthy, no crash loops.

- [ ] **Step 7: Send test email**

```bash
# Install swaks if needed: brew install swaks
swaks --to test@rawmail.sh --from sender@example.com \
  --server localhost --port 25 \
  --header "Subject: Test" --body "Hello rawmail"
```

Expected: email stored in PostgreSQL `messages` table.

```bash
docker compose exec postgres psql -U rawmail -c "SELECT address, subject FROM inboxes JOIN messages ON messages.inbox_id = inboxes.id;"
```

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml Caddyfile .env.example apps/api/Dockerfile apps/mail/Dockerfile
git commit -m "feat: docker compose — all services with caddy TLS, postgres, redis"
```

---

## Phase 2 — Web UI

### Task 13: Next.js Scaffold + Landing Page

**Files:**
- Create: `apps/web/` (Next.js 15 app)
- Create: `apps/web/app/page.tsx` (landing)
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/package.json`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd apps && pnpm create next-app@latest web --typescript --tailwind --app --no-src-dir --no-eslint
```

- [ ] **Step 2: Update apps/web/package.json — add @rawmail/shared**

```json
{
  "dependencies": {
    "@rawmail/shared": "workspace:*"
  }
}
```

Run: `pnpm install`

- [ ] **Step 3: Create apps/web/lib/api.ts**

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}
```

- [ ] **Step 4: Create apps/web/app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'rawmail — Disposable email done right',
  description: 'Private, owned inboxes with a real API. No sign-up, no tracking, no ads.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Create apps/web/app/page.tsx (landing)**

```typescript
import Link from 'next/link'
import { InboxInput } from '@/components/InboxInput'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">rawmail</span>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white">Sign in</Link>
      </nav>

      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-4">Disposable email <span className="text-green-400">done right</span></h1>
        <p className="text-gray-400 text-lg mb-12">Private, owned inboxes with a real API. No sign-up, no tracking, no ads.</p>
        <InboxInput />
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Claimed inboxes', desc: 'Lock an inbox to a secret token. Invisible to anyone without it.' },
          { title: 'Pixel stripping', desc: 'Tracking pixels removed server-side before delivery.' },
          { title: 'REST + SSE API', desc: 'Full API and real-time streaming. OpenAPI spec included.' },
          { title: 'Zero logs', desc: 'No IP logging. No metadata retention. Nothing to subpoena.' },
          { title: 'Custom domains', desc: 'Use your own domain for org inboxes like team@tmp.acme.com.' },
          { title: 'Open source', desc: 'MIT licensed. Self-host with docker compose up.' },
        ].map((f) => (
          <div key={f.title} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: next.js scaffold, landing page, api fetch util"
```

---

### Task 14: Inbox UX — Input + View

**Files:**
- Create: `apps/web/components/InboxInput.tsx`
- Create: `apps/web/components/MessageList.tsx`
- Create: `apps/web/components/MessageDetail.tsx`
- Create: `apps/web/components/ClaimModal.tsx`
- Create: `apps/web/lib/sse.ts`
- Create: `apps/web/app/inbox/[address]/page.tsx`

- [ ] **Step 1: Create apps/web/components/InboxInput.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InboxInput() {
  const [value, setValue] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const address = value.trim()
    if (!address) return
    router.push(`/inbox/${encodeURIComponent(address)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
      <input
        type="text"
        placeholder="anything@rawmail.sh"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg text-sm"
      >
        Open
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create apps/web/lib/sse.ts**

```typescript
'use client'
import { useEffect, useState } from 'react'
import type { Message } from '@rawmail/shared'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useInboxStream(address: string, token?: string) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const url = new URL(`${BASE}/v1/inboxes/${encodeURIComponent(address)}/stream`)
    const headers: HeadersInit = token ? { 'X-Inbox-Token': token } : {}

    const es = new EventSource(url.toString())

    es.onmessage = (e) => {
      if (e.data === ':ping') return
      try {
        const msg: Message = JSON.parse(e.data)
        setMessages((prev) => [msg, ...prev])
      } catch {}
    }

    return () => es.close()
  }, [address, token])

  return messages
}
```

- [ ] **Step 3: Create apps/web/app/inbox/[address]/page.tsx**

```typescript
import { MessageList } from '@/components/MessageList'
import { apiFetch } from '@/lib/api'
import type { Inbox, Message } from '@rawmail/shared'
import { ClaimModal } from '@/components/ClaimModal'

interface Props { params: { address: string } }

export default async function InboxPage({ params }: Props) {
  const address = decodeURIComponent(params.address)
  const [inbox, messages] = await Promise.all([
    apiFetch<Inbox>(`/v1/inboxes/${address}`),
    apiFetch<Message[]>(`/v1/inboxes/${address}/messages`),
  ])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <a href="/" className="text-xl font-bold tracking-tight">rawmail</a>
        <div className="flex items-center gap-4">
          <code className="text-sm text-green-400 bg-gray-900 px-3 py-1 rounded">{address}</code>
          {!inbox.isClaimed && <ClaimModal address={address} />}
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <MessageList address={address} initialMessages={messages} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Create apps/web/components/MessageList.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useInboxStream } from '@/lib/sse'
import { MessageDetail } from './MessageDetail'
import type { Message } from '@rawmail/shared'

interface Props {
  address: string
  initialMessages: Message[]
  token?: string
}

export function MessageList({ address, initialMessages, token }: Props) {
  const streamMessages = useInboxStream(address, token)
  const [selected, setSelected] = useState<Message | null>(null)

  const all = [...streamMessages, ...initialMessages].filter(
    (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
  )

  if (selected) {
    return <MessageDetail message={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      {all.length === 0 && (
        <p className="text-gray-500 text-center py-16">Waiting for emails...</p>
      )}
      {all.map((m) => (
        <button
          key={m.id}
          onClick={() => setSelected(m)}
          className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg p-4 mb-2 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{m.fromAddress}</span>
            <span className="text-xs text-gray-500">
              {new Date(m.receivedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-300">{m.subject}</p>
          <p className="text-xs text-gray-500 truncate mt-1">{m.textBody.slice(0, 100)}</p>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create apps/web/components/MessageDetail.tsx**

```typescript
'use client'
import type { Message } from '@rawmail/shared'

interface Props { message: Message; onBack: () => void }

export function MessageDetail({ message, onBack }: Props) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-6">← Back</button>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">{message.subject}</h2>
        <p className="text-sm text-gray-400 mb-6">From: {message.fromAddress}</p>
        {message.htmlBody ? (
          <iframe
            srcDoc={message.htmlBody}
            sandbox="allow-popups"
            className="w-full min-h-96 bg-white rounded"
          />
        ) : (
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">{message.textBody}</pre>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create apps/web/components/ClaimModal.tsx**

```typescript
'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { ClaimResponse } from '@rawmail/shared'

interface Props { address: string }

export function ClaimModal({ address }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    setLoading(true)
    try {
      const res = await apiFetch<ClaimResponse>(`/v1/inboxes/${address}/claim`, { method: 'POST' })
      setToken(res.token)
      localStorage.setItem(`token:${address}`, res.token)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded hover:bg-yellow-400/10">
        Claim inbox
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
        {token ? (
          <>
            <h3 className="font-semibold text-lg mb-2">Inbox claimed</h3>
            <p className="text-sm text-gray-400 mb-4">Save this token — it won&apos;t be shown again.</p>
            <code className="block bg-gray-950 text-green-400 text-xs p-3 rounded break-all mb-4">{token}</code>
            <button onClick={() => setOpen(false)} className="w-full bg-green-500 text-black font-semibold py-2 rounded">Done</button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-lg mb-2">Claim this inbox?</h3>
            <p className="text-sm text-gray-400 mb-6">Claiming locks this inbox to a secret token. Only you will be able to read it.</p>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 border border-gray-700 py-2 rounded text-sm">Cancel</button>
              <button onClick={handleClaim} disabled={loading} className="flex-1 bg-green-500 text-black font-semibold py-2 rounded text-sm disabled:opacity-50">
                {loading ? 'Claiming...' : 'Claim'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Add web Dockerfile**

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/web/ apps/web/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @rawmail/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
CMD ["node", "server.js"]
```

- [ ] **Step 8: Start dev server and verify UX**

```bash
cd apps/api && pnpm dev &
cd apps/web && pnpm dev
```

Open `http://localhost:3000`. Type `test@rawmail.sh`. Verify inbox opens immediately. Send a test email via swaks. Verify it appears in real-time.

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat: web UI — inbox input, message list with SSE, message detail, claim modal"
```

---

## Phase 3 — Auth + Orgs

### Task 15: Better-auth Setup

**Files:**
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/package.json`

- [ ] **Step 1: Create packages/auth/package.json**

```json
{
  "name": "@rawmail/auth",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "better-auth": "^1.0.0",
    "@rawmail/db": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.4.0" }
}
```

Run: `pnpm install`

- [ ] **Step 2: Create packages/auth/src/index.ts**

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Db } from '@rawmail/db'
import * as schema from '@rawmail/db'

export function createAuth(db: Db) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    callbacks: {
      async session({ session, user }) {
        return { ...session, user: { ...session.user, id: user.id } }
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
```

- [ ] **Step 3: Mount Better-auth in Fastify**

In `apps/api/src/index.ts`, add after plugins:

```typescript
import { createAuth } from '@rawmail/auth'

// Add to buildApp():
app.addHook('onReady', async () => {
  const auth = createAuth(app.db)
  app.all('/v1/auth/*', async (req, reply) => {
    const response = await auth.handler(req.raw)
    reply.raw.writeHead(response.status, Object.fromEntries(response.headers))
    reply.raw.end(await response.text())
  })
})
```

- [ ] **Step 4: Add SSO auto-join hook**

In `packages/auth/src/index.ts`, extend `createAuth`:

```typescript
// Inside betterAuth config, add after socialProviders:
hooks: {
  after: [
    {
      matcher: (ctx) => ctx.path === '/sign-in/social' && ctx.body?.provider === 'google',
      handler: async (ctx) => {
        if (!ctx.context.newSession?.user?.email) return
        const email = ctx.context.newSession.user.email
        const domain = email.split('@')[1]

        const org = await db.query.orgs.findFirst({
          where: (o, { eq }) => eq(o.ssoDomain, domain),
        })
        if (!org) return

        const userId = ctx.context.newSession.user.id
        await db.update(schema.users)
          .set({ orgId: org.id, role: 'member' })
          .where((u, { eq }) => eq(u.id, userId))
      },
    },
  ],
},
```

- [ ] **Step 5: Commit**

```bash
git add packages/auth apps/api/src/index.ts
git commit -m "feat: better-auth google oauth with SSO domain auto-join"
```

---

### Task 16: Org Routes + UI

**Files:**
- Create: `apps/api/src/routes/orgs.ts`
- Create: `apps/api/src/routes/members.ts`
- Create: `apps/api/src/services/org.service.ts`
- Create: `apps/web/app/org/[slug]/page.tsx`

- [ ] **Step 1: Create apps/api/src/services/org.service.ts**

```typescript
import { eq } from 'drizzle-orm'
import { orgs, users, inboxes, type Db } from '@rawmail/db'

export class OrgService {
  constructor(private db: Db) {}

  async create(data: { name: string; slug: string; ownerId: string }) {
    const [org] = await this.db.insert(orgs)
      .values({ name: data.name, slug: data.slug })
      .returning()

    await this.db.update(users)
      .set({ orgId: org.id, role: 'owner' })
      .where(eq(users.id, data.ownerId))

    return org
  }

  async getBySlug(slug: string) {
    return this.db.query.orgs.findFirst({ where: eq(orgs.slug, slug) })
  }

  async update(slug: string, data: { name?: string; ssoDomain?: string }) {
    const [updated] = await this.db.update(orgs)
      .set(data)
      .where(eq(orgs.slug, slug))
      .returning()
    return updated
  }

  async listInboxes(slug: string) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    return this.db.query.inboxes.findMany({
      where: eq(inboxes.orgId, org.id),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    })
  }

  async createInbox(slug: string, address: string, ttlDays = 30) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    const ttlExpiresAt = new Date()
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + ttlDays)
    const [inbox] = await this.db.insert(inboxes)
      .values({ address, orgId: org.id, ttlExpiresAt })
      .returning()
    return inbox
  }

  async listMembers(slug: string) {
    const org = await this.getBySlug(slug)
    if (!org) throw new Error('Org not found')
    return this.db.query.users.findMany({ where: eq(users.orgId, org.id) })
  }

  async removeMember(orgSlug: string, userId: string) {
    await this.db.update(users)
      .set({ orgId: null, role: 'member' })
      .where(eq(users.id, userId))
  }

  async updateMemberRole(userId: string, role: string) {
    await this.db.update(users).set({ role }).where(eq(users.id, userId))
  }
}
```

- [ ] **Step 2: Create apps/api/src/routes/orgs.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { OrgService } from '../services/org.service'

export const orgRoutes: FastifyPluginAsync = async (app) => {
  const orgService = new OrgService(app.db)

  app.addHook('preHandler', async (req, reply) => {
    // Verify Better-auth session
    const session = await app.auth.api.getSession({ headers: req.headers as any })
    if (!session) return reply.code(401).send({ error: 'Unauthorized' })
    req.user = session.user
  })

  app.post<{ Body: { name: string; slug: string } }>('/', async (req, reply) => {
    const org = await orgService.create({ ...req.body, ownerId: req.user.id })
    return reply.code(201).send(org)
  })

  app.get<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
    const org = await orgService.getBySlug(req.params.slug)
    if (!org) return reply.code(404).send({ error: 'Not found' })
    return org
  })

  app.patch<{ Params: { slug: string }; Body: { name?: string; ssoDomain?: string } }>('/:slug', async (req) => {
    return orgService.update(req.params.slug, req.body)
  })

  app.get<{ Params: { slug: string } }>('/:slug/inboxes', async (req) => {
    return orgService.listInboxes(req.params.slug)
  })

  app.post<{ Params: { slug: string }; Body: { address: string } }>('/:slug/inboxes', async (req, reply) => {
    const inbox = await orgService.createInbox(req.params.slug, req.body.address)
    return reply.code(201).send(inbox)
  })

  app.get<{ Params: { slug: string } }>('/:slug/members', async (req) => {
    return orgService.listMembers(req.params.slug)
  })

  app.patch<{ Params: { slug: string; memberId: string }; Body: { role: string } }>('/:slug/members/:memberId', async (req) => {
    return orgService.updateMemberRole(req.params.memberId, req.body.role)
  })

  app.delete<{ Params: { slug: string; memberId: string } }>('/:slug/members/:memberId', async (req, reply) => {
    await orgService.removeMember(req.params.slug, req.params.memberId)
    return reply.code(204).send()
  })
}
```

Register in `apps/api/src/index.ts`:
```typescript
import { orgRoutes } from './routes/orgs'
// add to buildApp():
app.register(orgRoutes, { prefix: '/v1/orgs' })
```

- [ ] **Step 3: Create apps/web/app/org/[slug]/page.tsx**

```typescript
import { apiFetch } from '@/lib/api'
import type { Inbox } from '@rawmail/shared'

interface Props { params: { slug: string } }

export default async function OrgDashboard({ params }: Props) {
  const inboxes = await apiFetch<Inbox[]>(`/v1/orgs/${params.slug}/inboxes`)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <a href="/" className="text-xl font-bold">rawmail</a>
        <span className="text-sm text-gray-400">{params.slug}</span>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Inboxes</h1>
        <div className="space-y-2">
          {inboxes.map((inbox) => (
            <a
              key={inbox.id}
              href={`/inbox/${encodeURIComponent(inbox.address)}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors"
            >
              <span className="text-green-400 text-sm font-mono">{inbox.address}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/orgs.ts apps/api/src/routes/members.ts apps/api/src/services/org.service.ts apps/web/app/org
git commit -m "feat: org routes + dashboard — create org, list inboxes, member management"
```

---

## Phase 4 — Categories + Custom Domains

### Task 17: Category CRUD

**Files:**
- Create: `apps/api/src/routes/categories.ts`
- Create: `apps/api/src/services/category.service.ts`

- [ ] **Step 1: Create apps/api/src/services/category.service.ts**

```typescript
import { eq, isNull } from 'drizzle-orm'
import { categories, type Db } from '@rawmail/db'

export class CategoryService {
  constructor(private db: Db) {}

  async list(orgId: string) {
    const all = await this.db.query.categories.findMany({
      where: eq(categories.orgId, orgId),
      orderBy: (c, { asc }) => [asc(c.name)],
    })
    // Build tree: top-level + children
    const roots = all.filter((c) => !c.parentId)
    return roots.map((root) => ({
      ...root,
      children: all.filter((c) => c.parentId === root.id),
    }))
  }

  async create(orgId: string, name: string, parentId?: string) {
    if (parentId) {
      const parent = await this.db.query.categories.findFirst({
        where: eq(categories.id, parentId),
      })
      if (parent?.parentId) throw new Error('Maximum one level of nesting')
    }
    const [cat] = await this.db.insert(categories)
      .values({ orgId, name, parentId })
      .returning()
    return cat
  }

  async update(id: string, data: { name?: string; parentId?: string | null }) {
    const [updated] = await this.db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning()
    return updated
  }

  async delete(id: string) {
    // Remove parent references from children first
    await this.db.update(categories)
      .set({ parentId: null })
      .where(eq(categories.parentId, id))
    await this.db.delete(categories).where(eq(categories.id, id))
  }
}
```

- [ ] **Step 2: Create apps/api/src/routes/categories.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { CategoryService } from '../services/category.service'
import { OrgService } from '../services/org.service'

export const categoryRoutes: FastifyPluginAsync = async (app) => {
  const categoryService = new CategoryService(app.db)
  const orgService = new OrgService(app.db)

  app.get<{ Params: { slug: string } }>('/:slug/categories', async (req, reply) => {
    const org = await orgService.getBySlug(req.params.slug)
    if (!org) return reply.code(404).send({ error: 'Org not found' })
    return categoryService.list(org.id)
  })

  app.post<{ Params: { slug: string }; Body: { name: string; parentId?: string } }>('/:slug/categories', async (req, reply) => {
    const org = await orgService.getBySlug(req.params.slug)
    if (!org) return reply.code(404).send({ error: 'Org not found' })
    const cat = await categoryService.create(org.id, req.body.name, req.body.parentId)
    return reply.code(201).send(cat)
  })

  app.patch<{ Params: { slug: string; id: string }; Body: { name?: string; parentId?: string } }>('/:slug/categories/:id', async (req) => {
    return categoryService.update(req.params.id, req.body)
  })

  app.delete<{ Params: { slug: string; id: string } }>('/:slug/categories/:id', async (req, reply) => {
    await categoryService.delete(req.params.id)
    return reply.code(204).send()
  })
}
```

Register in `apps/api/src/index.ts`:
```typescript
import { categoryRoutes } from './routes/categories'
app.register(categoryRoutes, { prefix: '/v1/orgs' })
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/categories.ts apps/api/src/services/category.service.ts
git commit -m "feat: category CRUD — tree structure, one-level nesting enforced"
```

---

### Task 18: Custom Domain Verification

**Files:**
- Create: `apps/api/src/services/domain.service.ts`
- Create: `apps/api/src/routes/domains.ts`

- [ ] **Step 1: Create apps/api/src/services/domain.service.ts**

```typescript
import { eq } from 'drizzle-orm'
import { promises as dns } from 'dns'
import { domains, type Db } from '@rawmail/db'
import cron from 'node-cron'

const MX_TARGET = process.env.MX_TARGET ?? 'mx.rawmail.sh'

export class DomainService {
  constructor(private db: Db) {}

  async add(orgId: string, domain: string) {
    const [d] = await this.db.insert(domains)
      .values({ orgId, domain })
      .returning()
    return d
  }

  async verify(id: string) {
    const domain = await this.db.query.domains.findFirst({
      where: eq(domains.id, id),
    })
    if (!domain) throw new Error('Domain not found')

    try {
      const addresses = await dns.resolveMx(domain.domain)
      const verified = addresses.some(
        (mx) => mx.exchange.toLowerCase() === MX_TARGET.toLowerCase()
      )
      if (verified) {
        await this.db.update(domains)
          .set({ mxVerified: true, verifiedAt: new Date() })
          .where(eq(domains.id, id))
      }
      return { verified, addresses }
    } catch {
      return { verified: false, addresses: [] }
    }
  }

  startPolling() {
    return cron.schedule('*/15 * * * *', async () => {
      const unverified = await this.db.query.domains.findMany({
        where: eq(domains.mxVerified, false),
      })
      for (const d of unverified) {
        await this.verify(d.id)
      }
    })
  }
}
```

- [ ] **Step 2: Create apps/api/src/routes/domains.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { DomainService } from '../services/domain.service'
import { OrgService } from '../services/org.service'

export const domainRoutes: FastifyPluginAsync = async (app) => {
  const domainService = new DomainService(app.db)
  const orgService = new OrgService(app.db)

  app.post<{ Params: { slug: string }; Body: { domain: string } }>('/:slug/domains', async (req, reply) => {
    const org = await orgService.getBySlug(req.params.slug)
    if (!org) return reply.code(404).send({ error: 'Org not found' })
    const d = await domainService.add(org.id, req.body.domain)
    return reply.code(201).send({
      ...d,
      instructions: `Add MX record: ${req.body.domain} MX 10 ${process.env.MX_TARGET ?? 'mx.rawmail.sh'}`,
    })
  })

  app.get<{ Params: { slug: string; id: string } }>('/:slug/domains/:id/verify', async (req) => {
    return domainService.verify(req.params.id)
  })
}
```

Wire up in `apps/api/src/index.ts`:
```typescript
import { domainRoutes } from './routes/domains'
import { DomainService } from './services/domain.service'

app.register(domainRoutes, { prefix: '/v1/orgs' })
app.addHook('onReady', async () => {
  new DomainService(app.db).startPolling()
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/domain.service.ts apps/api/src/routes/domains.ts
git commit -m "feat: custom domain add + MX verification with 15-min polling"
```

---

## Phase 5 — Billing

### Task 19: Stripe Integration

**Files:**
- Create: `apps/api/src/services/billing.service.ts`
- Create: `apps/api/src/routes/billing.ts`

- [ ] **Step 1: Install Stripe**

```bash
cd apps/api && pnpm add stripe
```

- [ ] **Step 2: Create apps/api/src/services/billing.service.ts**

```typescript
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { orgs, type Db } from '@rawmail/db'

const TEAMS_PRICE_ID = process.env.STRIPE_TEAMS_PRICE_ID!

export class BillingService {
  private stripe: Stripe

  constructor(private db: Db) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }

  async createCheckoutSession(orgId: string, successUrl: string, cancelUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org) throw new Error('Org not found')

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: TEAMS_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId },
    })

    return { url: session.url }
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const org = await this.db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })
    if (!org?.stripeCustomerId) throw new Error('No billing account found')

    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl,
    })
    return { url: session.url }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.orgId
      if (orgId && session.customer) {
        await this.db.update(orgs)
          .set({ stripeCustomerId: session.customer as string })
          .where(eq(orgs.id, orgId))
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object as Stripe.Subscription
      const plan = sub.status === 'active' ? 'teams' : 'free'
      await this.db.update(orgs)
        .set({ plan, stripeSubscriptionId: sub.id })
        .where(eq(orgs.stripeCustomerId, sub.customer as string))
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await this.db.update(orgs)
        .set({ plan: 'free', stripeSubscriptionId: null })
        .where(eq(orgs.stripeCustomerId, sub.customer as string))
    }
  }
}
```

- [ ] **Step 3: Create apps/api/src/routes/billing.ts**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { BillingService } from '../services/billing.service'

export const billingRoutes: FastifyPluginAsync = async (app) => {
  const billingService = new BillingService(app.db)

  app.post<{ Body: { orgId: string; successUrl: string; cancelUrl: string } }>('/checkout', async (req) => {
    return billingService.createCheckoutSession(req.body.orgId, req.body.successUrl, req.body.cancelUrl)
  })

  app.post<{ Body: { orgId: string; returnUrl: string } }>('/portal', async (req) => {
    return billingService.createPortalSession(req.body.orgId, req.body.returnUrl)
  })

  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string
    try {
      await billingService.handleWebhook(req.rawBody as Buffer, sig)
      return { received: true }
    } catch (err: any) {
      return reply.code(400).send({ error: err.message })
    }
  })
}
```

Register in `apps/api/src/index.ts`:
```typescript
import { billingRoutes } from './routes/billing'
app.register(billingRoutes, { prefix: '/v1/billing' })
```

- [ ] **Step 4: Add plan-gating middleware**

Create `apps/api/src/plugins/plan-gate.ts`:

```typescript
import fp from 'fastify-plugin'
import { eq } from 'drizzle-orm'
import { orgs } from '@rawmail/db'

export const planGatePlugin = fp(async (app) => {
  app.decorate('requireTeams', async (req: any, reply: any) => {
    if (!req.user?.orgId) return reply.code(403).send({ error: 'Teams plan required' })
    const org = await app.db.query.orgs.findFirst({ where: eq(orgs.id, req.user.orgId) })
    if (org?.plan !== 'teams') return reply.code(403).send({ error: 'Teams plan required' })
  })
})
```

Add `preHandler: [app.requireTeams]` on org routes that require Teams plan (categories, custom domains, named inboxes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/billing.service.ts apps/api/src/routes/billing.ts apps/api/src/plugins/plan-gate.ts
git commit -m "feat: stripe billing — checkout, portal, webhook sync, teams plan gating"
```

---

## Phase 6 — SDK + Polish

### Task 20: @rawmail/sdk

**Files:**
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/inboxes.ts`
- Create: `packages/sdk/src/index.ts`
- Create: `packages/sdk/package.json`

- [ ] **Step 1: Create packages/sdk/package.json**

```json
{
  "name": "@rawmail/sdk",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } },
  "scripts": { "build": "tsup src/index.ts --format esm,cjs --dts" },
  "dependencies": { "@rawmail/shared": "workspace:*" },
  "devDependencies": { "tsup": "^8.0.0", "typescript": "^5.4.0" }
}
```

- [ ] **Step 2: Create packages/sdk/src/inboxes.ts**

```typescript
import type { Inbox, Message, ClaimResponse } from '@rawmail/shared'

export class InboxesNamespace {
  constructor(
    private baseUrl: string,
    private defaultToken?: string,
  ) {}

  private headers(token?: string): HeadersInit {
    const tok = token ?? this.defaultToken
    return tok ? { 'X-Inbox-Token': tok } : {}
  }

  async getOrCreate(address: string): Promise<Inbox> {
    const res = await fetch(`${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async listMessages(address: string, token?: string): Promise<Message[]> {
    const res = await fetch(
      `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/messages`,
      { headers: this.headers(token) }
    )
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async claim(address: string): Promise<ClaimResponse> {
    const res = await fetch(
      `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/claim`,
      { method: 'POST' }
    )
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  }

  async *stream(address: string, token?: string): AsyncGenerator<Message> {
    const url = `${this.baseUrl}/v1/inboxes/${encodeURIComponent(address)}/stream`
    const headers = this.headers(token)

    const res = await fetch(url, { headers })
    if (!res.ok || !res.body) throw new Error(`Stream error ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data && data !== ':ping') {
            yield JSON.parse(data) as Message
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Create packages/sdk/src/client.ts**

```typescript
import { InboxesNamespace } from './inboxes'

export interface RawmailClientOptions {
  baseUrl?: string
  token?: string
}

export class RawmailClient {
  readonly inboxes: InboxesNamespace

  constructor(opts: RawmailClientOptions = {}) {
    const base = opts.baseUrl ?? 'https://api.rawmail.sh'
    this.inboxes = new InboxesNamespace(base, opts.token)
  }
}
```

- [ ] **Step 4: Create packages/sdk/src/index.ts**

```typescript
export { RawmailClient } from './client'
export type { RawmailClientOptions } from './client'
export * from '@rawmail/shared'
```

- [ ] **Step 5: Build and verify**

```bash
cd packages/sdk && pnpm build
```

Expected: `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` created.

- [ ] **Step 6: Write SDK smoke test**

```typescript
// packages/sdk/test/client.test.ts
import { describe, it, expect, vi } from 'vitest'
import { RawmailClient } from '../src/client'

describe('RawmailClient', () => {
  it('constructs with defaults', () => {
    const client = new RawmailClient()
    expect(client.inboxes).toBeDefined()
  })

  it('constructs with custom baseUrl', () => {
    const client = new RawmailClient({ baseUrl: 'http://localhost:3001' })
    expect(client.inboxes).toBeDefined()
  })
})
```

```bash
cd packages/sdk && pnpm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/sdk
git commit -m "feat: @rawmail/sdk — RawmailClient with inboxes.getOrCreate, listMessages, claim, stream"
```

---

### Task 21: OpenAPI + Final Polish

**Files:**
- Modify: `apps/api/src/index.ts` (add swagger)
- Create: `README.md`

- [ ] **Step 1: Install swagger plugins**

```bash
cd apps/api && pnpm add @fastify/swagger @fastify/swagger-ui
```

- [ ] **Step 2: Register swagger in apps/api/src/index.ts**

Add before route registrations:

```typescript
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

await app.register(swagger, {
  openapi: {
    info: { title: 'rawmail API', version: '1.0.0' },
    servers: [{ url: 'https://api.rawmail.sh' }],
  },
})
await app.register(swaggerUi, { routePrefix: '/docs' })
```

- [ ] **Step 3: Final docker compose up smoke test**

```bash
docker compose up -d
curl http://localhost:3001/docs/json | jq '.info.title'
```

Expected: `"rawmail API"`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat: openapi spec via @fastify/swagger at /docs"
```

---

## Verification Checklist

- [ ] Phase 1: `swaks --to test@rawmail.sh` → message in `messages` table
- [ ] Phase 2: Type address in browser → inbox opens → send email → appears live
- [ ] Phase 3: Google login with `@penny.co` → auto-joined to penny.co org
- [ ] Phase 4: Add `tmp.penny.co` → MX poll verifies → email arrives in org dashboard
- [ ] Phase 5: Upgrade button → Stripe Checkout → webhook → `org.plan = 'teams'`
- [ ] Phase 6: `npm install @rawmail/sdk` → `client.inboxes.stream()` yields messages
