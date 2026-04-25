'use client'
import { useEffect, useState } from 'react'
import { authedFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Category { id: string; name: string; parentId: string | null; children?: Category[] }

function buildTree(flat: Category[]): Category[] {
  const map = new Map(flat.map(c => [c.id, { ...c, children: [] as Category[] }]))
  const roots: Category[] = []
  for (const c of map.values()) {
    if (c.parentId) map.get(c.parentId)?.children?.push(c)
    else roots.push(c)
  }
  return roots
}

function CategoryNode({
  cat, slug, onDelete, onRename, onAddChild,
}: {
  cat: Category; slug: string
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onAddChild: (parentId: string, name: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(cat.name)
  const [addingChild, setAddingChild] = useState(false)
  const [childName, setChildName] = useState('')

  async function saveRename() {
    await authedFetch(`/v1/orgs/${slug}/categories/${cat.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName }),
    })
    onRename(cat.id, newName)
    setEditing(false)
  }

  async function confirmDelete() {
    if (!confirm(`Delete "${cat.name}"?`)) return
    await authedFetch(`/v1/orgs/${slug}/categories/${cat.id}`, { method: 'DELETE' })
    onDelete(cat.id)
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault()
    await onAddChild(cat.id, childName)
    setChildName('')
    setAddingChild(false)
  }

  return (
    <li className="pl-4 border-l border-gray-200">
      <div className="flex items-center gap-2 py-1.5">
        {editing ? (
          <>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-7 text-sm flex-1" />
            <Button variant="yellow" onClick={saveRename} className="h-7 px-2 text-xs">Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)} className="h-7 px-2 text-xs">Cancel</Button>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-800 flex-1">{cat.name}</span>
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
            {!cat.parentId && (
              <button onClick={() => setAddingChild(v => !v)} className="text-xs text-gray-400 hover:text-gray-700">+ Sub</button>
            )}
            <button onClick={confirmDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          </>
        )}
      </div>
      {addingChild && (
        <form onSubmit={addChild} className="flex gap-2 pl-4 pb-2">
          <Input value={childName} onChange={e => setChildName(e.target.value)} placeholder="Sub-category name" className="h-7 text-sm" required />
          <Button variant="yellow" type="submit" className="h-7 px-2 text-xs">Add</Button>
        </form>
      )}
      {cat.children && cat.children.length > 0 && (
        <ul>
          {cat.children.map(child => (
            <CategoryNode key={child.id} cat={child} slug={slug} onDelete={onDelete} onRename={onRename} onAddChild={onAddChild} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function CategoriesTab({ slug }: { slug: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    authedFetch<Category[]>(`/v1/orgs/${slug}/categories`).then(setCategories).catch(() => {})
  }, [slug])

  const tree = buildTree(categories)

  async function addRoot(e: React.FormEvent) {
    e.preventDefault()
    const cat = await authedFetch<Category>(`/v1/orgs/${slug}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    })
    setCategories(prev => [...prev, cat])
    setNewName('')
  }

  async function addChild(parentId: string, name: string) {
    const cat = await authedFetch<Category>(`/v1/orgs/${slug}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    })
    setCategories(prev => [...prev, cat])
  }

  return (
    <div className="max-w-md space-y-6">
      <ul className="space-y-1">
        {tree.map(cat => (
          <CategoryNode key={cat.id} cat={cat} slug={slug}
            onDelete={id => setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id))}
            onRename={(id, name) => setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
            onAddChild={addChild}
          />
        ))}
        {tree.length === 0 && <li className="text-sm text-gray-400 py-4 text-center">No categories yet</li>}
      </ul>
      <form onSubmit={addRoot} className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name" required className="flex-1" />
        <Button type="submit" variant="yellow">Add</Button>
      </form>
    </div>
  )
}
