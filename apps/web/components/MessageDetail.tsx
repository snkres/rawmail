'use client'
import { ArrowLeft } from 'lucide-react'
import type { Message } from '@rawmail/shared'
import { Button } from '@/components/ui/button'

interface Props {
  message: Message
  onBack: () => void
}

export function MessageDetail({ message, onBack }: Props) {
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-5 -ml-2 gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        Back to inbox
      </Button>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {message.subject || '(no subject)'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{message.fromAddress}</span>
            <span>·</span>
            <span>{new Date(message.receivedAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="p-6">
          {message.htmlBody ? (
            <iframe
              srcDoc={message.htmlBody}
              sandbox="allow-popups"
              className="w-full min-h-96 rounded-xl border border-gray-100"
              title="Email content"
            />
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {message.textBody}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
