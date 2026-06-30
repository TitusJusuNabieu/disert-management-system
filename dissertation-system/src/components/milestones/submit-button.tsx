'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

export function SubmitMilestoneButton({ milestoneId }: { milestoneId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUBMITTED' }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      if (d.reauth) { window.location.href = '/api/auth/signout?callbackUrl=/login'; return }
    }
    router.refresh()
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Upload className="h-4 w-4" />
      {loading ? 'Submitting…' : 'Submit for Review'}
    </button>
  )
}
