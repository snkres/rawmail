import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'rawmail - Disposable email done right',
  description:
    'Private, owned inboxes with a real API. No sign-up, no tracking, no ads.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
