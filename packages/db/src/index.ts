import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import path from 'path'
import * as schema from './schema'

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}

export async function runMigrations(connectionString: string) {
  const pool = new Pool({ connectionString })

  for (let i = 0; i < 10; i++) {
    try {
      await pool.query('SELECT 1')
      break
    } catch {
      if (i === 9) throw new Error('Database not reachable after 10 attempts')
      console.log(`[migrate] Waiting for database... (${i + 1}/10)`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  const db = drizzle(pool)
  // __dirname is packages/db/dist — migrations sit one level up in migrations/
  const migrationsFolder = path.join(__dirname, '../migrations')
  console.log(`[migrate] Running migrations from ${migrationsFolder}`)
  await migrate(db, { migrationsFolder })
  console.log('[migrate] Migrations complete')
  await pool.end()
}

export type Db = ReturnType<typeof createDb>
export * from './schema'
