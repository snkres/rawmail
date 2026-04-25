'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-4xl font-bold text-gray-200">!</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Something went wrong</h1>
        <button onClick={reset} className="mt-4 text-sm font-medium text-yellow-500 hover:underline">
          Try again
        </button>
      </div>
    </div>
  )
}
