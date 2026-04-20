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
