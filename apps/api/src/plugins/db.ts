import fp from 'fastify-plugin'
import { createDb, type Db } from '@rawmail/db'

declare module 'fastify' {
  interface FastifyInstance {
    db: Db
  }
}

export const dbPlugin = fp(async (app) => {
  app.decorate('db', createDb(process.env.DATABASE_URL!))
})
