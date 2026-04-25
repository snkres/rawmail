import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-yellow-400">404</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-gray-900 hover:text-yellow-500 underline">
          Go home
        </Link>
      </div>
    </div>
  )
}
