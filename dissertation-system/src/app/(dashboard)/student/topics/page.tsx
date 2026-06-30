'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, X, Check, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Topic {
  id: string
  title: string
  description: string | null
  rationale: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  reviewedBy: { id: string; name: string; role: string } | null
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', variant: 'ghost' as const,   icon: Clock,         color: 'text-gray-500' },
  APPROVED: { label: 'Approved',       variant: 'success' as const,  icon: CheckCircle2,  color: 'text-green-600' },
  REJECTED: { label: 'Rejected',       variant: 'danger' as const,   icon: X,             color: 'text-red-600' },
}

export default function StudentTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', rationale: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchTopics() {
    try {
      const res = await fetch('/api/topics')
      if (!res.ok) return
      const data = await res.json()
      setTopics(Array.isArray(data) ? data : [])
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTopics() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setShowForm(false)
      setForm({ title: '', description: '', rationale: '' })
      await fetchTopics()
      showToast('success', 'Topic submitted successfully.')
    } else if (data.reauth) {
      window.location.href = '/api/auth/signout?callbackUrl=/login'
    } else {
      setFormError(data.error ?? 'Failed to submit topic.')
    }
    setSaving(false)
  }

  async function handleWithdraw(id: string) {
    const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (res.ok) {
      await fetchTopics()
      showToast('success', 'Topic withdrawn.')
    } else if (d.reauth) {
      window.location.href = '/api/auth/signout?callbackUrl=/login'
    } else {
      showToast('error', d.error ?? 'Failed to withdraw topic.')
    }
  }

  const hasApproved = topics.some(t => t.status === 'APPROVED')

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
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Project Topics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit up to 3 topic proposals. Your supervisor or HOD will approve the best one.
          </p>
        </div>
        {!hasApproved && (
          <Button onClick={() => { setForm({ title: '', description: '', rationale: '' }); setFormError(''); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Submit Topic
          </Button>
        )}
      </div>

      {hasApproved && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Topic approved — your project has been registered.</p>
            <p className="text-xs text-green-700">You can now track your project milestones from the Dashboard.</p>
          </div>
        </div>
      )}

      {/* Submit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Submit Project Topic</CardTitle>
                <button onClick={() => setShowForm(false)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Topic Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Design and Implementation of…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Brief Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will this project do or solve?"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Rationale / Motivation</label>
                  <textarea
                    rows={3}
                    value={form.rationale}
                    onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
                    placeholder="Why is this topic important? What problem does it address?"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />{formError}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    <Check className="h-4 w-4" />
                    {saving ? 'Submitting…' : 'Submit Topic'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <p className="text-sm font-medium text-gray-500">No topics submitted yet.</p>
          <p className="mt-1 text-xs text-gray-400">Click "Submit Topic" to propose your first project topic.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map(t => {
            const cfg = STATUS_CONFIG[t.status]
            const Icon = cfg.icon
            return (
              <Card key={t.id} className={t.status === 'APPROVED' ? 'border-green-200 bg-green-50/30' : t.status === 'REJECTED' ? 'border-red-100' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{t.title}</h3>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">Submitted {formatDateTime(t.createdAt)}</p>

                        {t.description && (
                          <p className="mt-2 text-sm text-gray-600">{t.description}</p>
                        )}
                        {t.rationale && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500">Rationale</p>
                            <p className="text-sm text-gray-600">{t.rationale}</p>
                          </div>
                        )}

                        {t.reviewNote && (
                          <div className={`mt-3 rounded-lg p-3 ${t.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-50'}`}>
                            <p className="text-xs font-medium text-gray-500">
                              Feedback from {t.reviewedBy?.name ?? 'Reviewer'} · {formatDateTime(t.reviewedAt)}
                            </p>
                            <p className={`mt-1 text-sm ${t.status === 'APPROVED' ? 'text-green-800' : 'text-red-700'}`}>
                              {t.reviewNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleWithdraw(t.id)}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Withdraw topic"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
