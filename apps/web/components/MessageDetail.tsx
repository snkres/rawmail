'use client'
import type { Message } from '@rawmail/shared'

interface Props {
  message: Message
  onBack: () => void
}

export function MessageDetail({ message, onBack }: Props) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-6">
        Back
      </button>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">{message.subject}</h2>
        <p className="text-sm text-gray-400 mb-6">From: {message.fromAddress}</p>
        {message.htmlBody ? (
          <iframe
            srcDoc={message.htmlBody}
            sandbox="allow-popups"
            className="w-full min-h-96 bg-white rounded"
          />
        ) : (
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">{message.textBody}</pre>
        )}
      </div>
    </div>
  )
}
