'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { FeedbackPanel } from '@/components/feedback/feedback-panel'
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'
import { MilestoneWithFeedback } from '@/types'

interface StudentProject {
  id: string
  title: string
  academicYear: string
  student: { id: string; name: string; email: string; studentId: string | null }
  milestones: MilestoneWithFeedback[]
}

export default function SupervisorStudentsPage() {
  const [projects, setProjects] = useState<StudentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/supervisors')
      if (!res.ok) return
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {
      // keep stale state on network error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleStatusChange(milestoneId: string, status: string) {
    const res = await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      showToast('success', status === 'APPROVED' ? 'Milestone approved.' : 'Milestone rejected.')
      await fetchData()
    } else {
      const d = await res.json().catch(() => ({}))
      showToast('error', d.error ?? 'Failed to update milestone.')
    }
  }

  async function handleFeedback(content: string, milestoneId: string, recipientId: string) {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, milestoneId, recipientId }),
    })
    if (res.ok) {
      showToast('success', 'Feedback submitted.')
      await fetchData()
    } else {
      const d = await res.json().catch(() => ({}))
      showToast('error', d.error ?? 'Failed to submit feedback.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {toast && (
        <div className={`fixed bottom-5 right-4 z-50 flex max-w-xs items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:right-5 ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {toast.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Students</h1>
        <p className="mt-1 text-sm text-gray-500">
          {projects.length} student project{projects.length !== 1 ? 's' : ''} under your supervision.
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-500">No students assigned yet.</p>
      ) : (
        <div className="space-y-4">
          {projects.map(p => {
            const approved = p.milestones.filter(m => m.status === 'APPROVED').length
            const pending = p.milestones.filter(m => m.status === 'SUBMITTED').length
            const isOpen = expanded === p.id
            const submittedMilestones = p.milestones.filter(m => m.status === 'SUBMITTED')

            return (
              <Card key={p.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full text-left"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base">{p.student.name}</CardTitle>
                        <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">{p.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {pending > 0 && <Badge variant="warning" className="hidden sm:inline-flex">{pending} pending</Badge>}
                        <Badge variant="success">{approved}/{p.milestones.length}</Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isOpen && (
                  <CardContent>
                    {/* Pending review actions */}
                    {submittedMilestones.length > 0 && (
                      <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-orange-800">Submissions Awaiting Review</p>
                        <div className="space-y-2">
                          {submittedMilestones.map(m => (
                            <div key={m.id} className="flex flex-col gap-2 rounded-lg bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-sm font-medium text-gray-800">{m.name}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusChange(m.id, 'APPROVED')}
                                  className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors sm:flex-none"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(m.id, 'REJECTED')}
                                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors sm:flex-none"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <MilestoneTracker milestones={p.milestones} canSubmit={false} />

                    {/* Feedback section */}
                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Leave Feedback on a Milestone</p>
                      <select
                        value={activeMilestone ?? ''}
                        onChange={e => setActiveMilestone(e.target.value || null)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select milestone…</option>
                        {p.milestones.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>

                      {activeMilestone && (
                        <FeedbackPanel
                          feedbackList={p.milestones.find(m => m.id === activeMilestone)?.feedback ?? []}
                          canLeave
                          onSubmit={(content) => handleFeedback(content, activeMilestone, p.student.id)}
                        />
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
