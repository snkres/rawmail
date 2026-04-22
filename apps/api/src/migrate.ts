import { runMigrations } from '@rawmail/db'

runMigrations(process.env.DATABASE_URL!).catch((err: Error) => {
  console.error('[migrate] Failed:', err.message)
  process.exit(1)
})
