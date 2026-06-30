'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export interface TopicItem {
  id: string
  title: string
  description: string | null
  rationale: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  student?: { id: string; name: string; studentId: string | null }
  reviewedBy?: { id: string; name: string } | null
}

interface TopicReviewListProps {
  topics: TopicItem[]
  onReview: (id: string, status: 'APPROVED' | 'REJECTED', note: string) => Promise<void>
  showStudent?: boolean
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  variant: 'ghost' as const,   icon: Clock,        color: 'text-gray-400' },
  APPROVED: { label: 'Approved', variant: 'success' as const,  icon: CheckCircle2, color: 'text-green-500' },
  REJECTED: { label: 'Rejected', variant: 'danger' as const,   icon: XCircle,      color: 'text-red-500' },
}

export function TopicReviewList({ topics, onReview, showStudent = false }: TopicReviewListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, status: 'APPROVED' | 'REJECTED') {
    setLoading(id + status)
    await onReview(id, status, reviewNote[id] ?? '')
    setLoading(null)
    setExpanded(null)
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">No topic submissions yet.</p>
      </div>
    )
  }

  // Group by student if showing all
  const grouped = showStudent
    ? topics.reduce<Record<string, TopicItem[]>>((acc, t) => {
        const key = t.student?.name ?? 'Unknown'
        ;(acc[key] ??= []).push(t)
        return acc
      }, {})
    : { '': topics }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([studentName, items]) => (
        <div key={studentName}>
          {showStudent && studentName && (
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {studentName.charAt(0)}
              </div>
              <p className="text-sm font-semibold text-gray-800">{studentName}</p>
              <span className="text-xs text-gray-400">
                {items.find(i => i.student?.studentId)?.student?.studentId ?? ''}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {items.map(t => {
              const cfg = STATUS_CONFIG[t.status]
              const Icon = cfg.icon
              const isExpanded = expanded === t.id

              return (
                <Card key={t.id} className={
                  t.status === 'APPROVED' ? 'border-green-200 bg-green-50/20' :
                  t.status === 'REJECTED' ? 'border-red-100 bg-red-50/10' : ''
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{t.title}</span>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">Submitted {formatDateTime(t.createdAt)}</p>
                          {t.description && <p className="mt-1.5 text-sm text-gray-600">{t.description}</p>}
                          {t.rationale && (
                            <p className="mt-1 text-sm text-gray-500 italic">Rationale: {t.rationale}</p>
                          )}
                          {t.reviewNote && (
                            <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${t.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>
                              <span className="font-medium">Note:</span> {t.reviewNote}
                            </div>
                          )}
                        </div>
                      </div>

                      {t.status === 'PENDING' && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : t.id)}
                          className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>

                    {/* Review panel */}
                    {t.status === 'PENDING' && isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Review note (required for rejection, optional for approval)
                          </label>
                          <textarea
                            rows={2}
                            value={reviewNote[t.id] ?? ''}
                            onChange={e => setReviewNote(prev => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder="Add feedback for the student…"
                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={loading === t.id + 'APPROVED'}
                            onClick={() => handleAction(t.id, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {loading === t.id + 'APPROVED' ? 'Approving…' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={!reviewNote[t.id]?.trim() || loading === t.id + 'REJECTED'}
                            onClick={() => handleAction(t.id, 'REJECTED')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {loading === t.id + 'REJECTED' ? 'Rejecting…' : 'Reject'}
                          </Button>
                          <span className="text-xs text-gray-400 self-center">Note required to reject</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
