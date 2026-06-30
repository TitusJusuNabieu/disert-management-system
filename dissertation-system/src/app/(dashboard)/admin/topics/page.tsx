'use client'

import { useEffect, useState } from 'react'
import { TopicReviewList, TopicItem } from '@/components/topics/topic-review-list'
import { AlertCircle, Check } from 'lucide-react'

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [loading, setLoading] = useState(true)
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

  async function handleReview(id: string, status: 'APPROVED' | 'REJECTED', reviewNote: string) {
    const res = await fetch(`/api/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote }),
    })
    const d = await res.json()
    if (res.ok) {
      await fetchTopics()
      showToast('success', status === 'APPROVED' ? 'Topic approved — project registered automatically.' : 'Topic rejected.')
    } else if (d.reauth) {
      window.location.href = '/api/auth/signout?callbackUrl=/login'
    } else {
      showToast('error', d.error ?? 'Action failed.')
    }
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

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">All Student Topic Submissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          As HOD, review and approve the best topic per student. Approval auto-creates the student&apos;s project with 7 milestone stages.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <TopicReviewList topics={topics} onReview={handleReview} showStudent />
      )}
    </div>
  )
}
