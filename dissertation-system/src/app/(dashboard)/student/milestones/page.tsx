'use client'

import { useEffect, useState, useCallback } from 'react'
import { MilestoneTracker } from '@/components/milestones/milestone-tracker'
import { MilestoneWithFeedback } from '@/types'

interface Project {
  id: string
  title: string
  milestones: MilestoneWithFeedback[]
}

export default function StudentMilestonesPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/milestones')
      if (!res.ok) return
      const data = await res.json()
      setProject(data && data.milestones ? data : null)
    } catch {
      // keep null state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSubmit(milestoneId: string) {
    const res = await fetch(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUBMITTED' }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      if (d.reauth) { window.location.href = '/api/auth/signout?callbackUrl=/login'; return }
    }
    await fetchData()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!project) {
    return <div className="p-8 text-gray-500">No project found. Submit a topic proposal first.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Milestones</h1>
        <p className="mt-1 text-sm text-gray-500">{project.title}</p>
      </div>
      <MilestoneTracker
        milestones={project.milestones}
        onSubmit={handleSubmit}
        canSubmit
      />
    </div>
  )
}
