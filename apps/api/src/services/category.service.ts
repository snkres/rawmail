import { eq } from 'drizzle-orm'
import { categories, type Db } from '@rawmail/db'

export class CategoryService {
  constructor(private db: Db) {}

  async list(orgId: string) {
    const all = await this.db.query.categories.findMany({
      where: eq(categories.orgId, orgId),
      orderBy: (c, { asc }) => [asc(c.name)],
    })
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
    const [cat] = await this.db.insert(categories).values({ orgId, name, parentId }).returning()
    return cat
  }

  async update(id: string, data: { name?: string; parentId?: string | null }) {
    const [updated] = await this.db.update(categories).set(data).where(eq(categories.id, id)).returning()
    return updated
  }

  async delete(id: string) {
    await this.db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id))
    await this.db.delete(categories).where(eq(categories.id, id))
  }
}
