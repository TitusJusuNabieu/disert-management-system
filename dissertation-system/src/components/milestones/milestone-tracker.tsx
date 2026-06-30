'use client'

import { MilestoneStatus } from '@prisma/client'
import { cn, formatDate } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle, ChevronDown, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { MilestoneWithFeedback } from '@/types'

const statusConfig: Record<MilestoneStatus, { label: string; icon: React.ElementType; color: string; badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'ghost' }> = {
  PENDING:      { label: 'Pending',       icon: Circle,       color: 'text-gray-400',  badgeVariant: 'ghost' },
  SUBMITTED:    { label: 'Submitted',     icon: Clock,        color: 'text-blue-500',  badgeVariant: 'default' },
  UNDER_REVIEW: { label: 'Under Review',  icon: AlertCircle,  color: 'text-yellow-500', badgeVariant: 'warning' },
  APPROVED:     { label: 'Approved',      icon: CheckCircle2, color: 'text-green-500', badgeVariant: 'success' },
  REJECTED:     { label: 'Rejected',      icon: XCircle,      color: 'text-red-500',   badgeVariant: 'danger' },
}

interface MilestoneTrackerProps {
  milestones: MilestoneWithFeedback[]
  onSubmit?: (id: string) => Promise<void>
  canSubmit?: boolean
}

export function MilestoneTracker({ milestones, onSubmit, canSubmit }: MilestoneTrackerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const total = milestones.length
  const approved = milestones.filter(m => m.status === 'APPROVED').length
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0

  async function handleSubmit(id: string) {
    if (!onSubmit) return
    setLoading(id)
    await onSubmit(id)
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-blue-700">{approved}/{total} milestones completed</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100">
          <div
            className="h-3 rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{progress}% complete</p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-2">
        {milestones.map((m, idx) => {
          const { icon: Icon, color, label, badgeVariant } = statusConfig[m.status]
          const isExpanded = expanded === m.id
          const isLast = idx === milestones.length - 1

          return (
            <div key={m.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white', color === 'text-green-500' ? 'border-green-500' : color === 'text-blue-500' ? 'border-blue-500' : 'border-gray-200')}>
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
                {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200" style={{ minHeight: '20px' }} />}
              </div>

              {/* Card */}
              <div className={cn('mb-2 flex-1 rounded-xl border bg-white overflow-hidden', m.status === 'PENDING' && canSubmit ? 'border-blue-200' : 'border-gray-200')}>
                {/* Always-visible header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                        <Badge variant={badgeVariant}>{label}</Badge>
                      </div>
                      {m.description && (
                        <p className="mt-1 text-xs text-gray-500">{m.description}</p>
                      )}
                      {m.dueDate && (
                        <p className="mt-1 text-xs text-orange-600">Due: {formatDate(m.dueDate)}</p>
                      )}
                      {m.submittedAt && (
                        <p className="mt-1 text-xs text-gray-400">Submitted: {formatDate(m.submittedAt)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : m.id)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
                      title="Show feedback"
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>

                  {/* Submit button — always visible for pending milestones */}
                  {canSubmit && m.status === 'PENDING' && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleSubmit(m.id)}
                        disabled={loading === m.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {loading === m.id ? 'Submitting…' : 'Submit for Review'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expandable feedback section */}
                {isExpanded && m.feedback.length > 0 && (
                  <div className="border-t border-gray-100 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Supervisor Feedback</p>
                    {m.feedback.map(f => (
                      <div key={f.id} className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-800">{f.author.name}</p>
                        <p className="mt-1 text-sm text-gray-700">{f.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && m.feedback.length === 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-400 italic">No feedback on this milestone yet.</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
