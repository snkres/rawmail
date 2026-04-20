import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
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
  inboxId: uuid('inbox_id')
    .notNull()
    .references(() => inboxes.id, { onDelete: 'cascade' }),
  fromAddress: text('from_address').notNull(),
  subject: text('subject').notNull().default(''),
  htmlBody: text('html_body').notNull().default(''),
  textBody: text('text_body').notNull().default(''),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  storagePath: text('storage_path').notNull(),
  size: integer('size').notNull(),
})
