'use client'

import { useEffect, useState } from 'react'
import { MilestoneWithFeedback } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

export default function StudentFeedbackPage() {
  const [milestones, setMilestones] = useState<MilestoneWithFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/milestones')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setMilestones(d?.milestones ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const allFeedback = milestones.flatMap(m =>
    m.feedback.map(f => ({ ...f, milestoneName: m.name }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Feedback Received</h1>
        <p className="mt-1 text-sm text-gray-500">All feedback from your supervisor across milestones.</p>
      </div>

      {allFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No feedback yet</p>
          <p className="text-xs text-gray-400">Your supervisor's feedback will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allFeedback.map(f => (
            <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                    {f.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.author.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{f.author.role.toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="ghost">{f.milestoneName}</Badge>
                  <span className="text-xs text-gray-400">{formatDateTime(f.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{f.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
