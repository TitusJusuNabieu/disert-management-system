'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { Send } from 'lucide-react'
import { FeedbackItem } from '@/types'

interface FeedbackPanelProps {
  feedbackList: FeedbackItem[]
  canLeave: boolean
  onSubmit: (content: string) => Promise<void>
}

export function FeedbackPanel({ feedbackList, canLeave, onSubmit }: FeedbackPanelProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    await onSubmit(content.trim())
    setContent('')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {feedbackList.length === 0 && (
        <p className="text-sm text-gray-500 italic">No feedback yet.</p>
      )}

      {feedbackList.map(f => (
        <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                {f.author.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{f.author.name}</p>
                <p className="text-xs text-gray-400 capitalize">{f.author.role.toLowerCase()}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(f.createdAt)}</span>
          </div>
          <p className="mt-3 text-sm text-gray-700">{f.content}</p>
        </div>
      ))}

      {canLeave && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Leave feedback…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  )
}
