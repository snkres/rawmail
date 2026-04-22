'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
      <Input
        type="text"
        placeholder="anything@rawmail.sh"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 h-12 text-base"
      />
      <Button type="submit" variant="default" size="lg" className="shrink-0 gap-1.5">
        Open
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  )
}
