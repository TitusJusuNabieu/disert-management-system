'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Check, AlertCircle, UserCheck } from 'lucide-react'
import { siteConfig } from '@/lib/config'

interface User { id: string; name: string; email: string; role: string }
interface Project {
  id: string
  title: string
  department: string
  academicYear: string
  supervisorId: string | null
  student: { id: string; name: string }
  supervisor: { id: string; name: string } | null
  milestones: { status: string }[]
}

const emptyForm = {
  title: '', abstract: '', department: '', academicYear: '', studentId: '', supervisorId: '',
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [assignTarget, setAssignTarget] = useState<Project | null>(null)
  const [assignSupervisor, setAssignSupervisor] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchAll() {
    try {
      const [dRes, uRes] = await Promise.all([fetch('/api/dissertations'), fetch('/api/users')])
      const [d, u] = await Promise.all([
        dRes.ok ? dRes.json() : [],
        uRes.ok ? uRes.json() : [],
      ])
      setProjects(Array.isArray(d) ? d : [])
      const users: User[] = Array.isArray(u) ? u : []
      setStudents(users.filter(x => x.role === 'STUDENT'))
      setSupervisors(users.filter(x => x.role === 'SUPERVISOR'))
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const registeredStudentIds = new Set(projects.map(p => p.student.id))
  const unregisteredStudents = students.filter(s => !registeredStudentIds.has(s.id))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const res = await fetch('/api/dissertations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setShowForm(false)
      setForm(emptyForm)
      await fetchAll()
      showToast('success', `Project registered for ${data.student.name}.`)
    } else {
      setFormError(data.error ?? 'Something went wrong.')
    }
    setSaving(false)
  }

  async function handleAssign() {
    if (!assignTarget) return
    setAssigning(true)
    const res = await fetch(`/api/dissertations/${assignTarget.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisorId: assignSupervisor || null }),
    })
    if (res.ok) {
      showToast('success', 'Supervisor updated.')
      setAssignTarget(null)
      await fetchAll()
    } else {
      showToast('error', 'Failed to assign supervisor.')
    }
    setAssigning(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
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

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Project Registry</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? 's' : ''} registered ·{' '}
            {unregisteredStudents.length} student{unregisteredStudents.length !== 1 ? 's' : ''} without a project
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setFormError(''); setShowForm(true) }} disabled={unregisteredStudents.length === 0}>
          <Plus className="h-4 w-4" /> Register Project
        </Button>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <Card className="w-full max-h-[90vh] overflow-y-auto rounded-b-none rounded-t-2xl shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <CardHeader className="sticky top-0 bg-white z-10 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Register New Project</CardTitle>
                <button onClick={() => setShowForm(false)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Student *</label>
                  <select required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none">
                    <option value="">— Select student —</option>
                    {unregisteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Project Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Design and Implementation of…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Abstract</label>
                  <textarea rows={3} value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
                    placeholder="Brief description of the project…"
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder={siteConfig.department}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                    <p className="mt-1 text-xs text-gray-400">Defaults to {siteConfig.department}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Academic Year *</label>
                    <input required value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                      placeholder="e.g. 2025/2026"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Assign Supervisor (optional)</label>
                  <select value={form.supervisorId} onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none">
                    <option value="">— Unassigned —</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {formError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />{formError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    <Check className="h-4 w-4" />
                    {saving ? 'Registering…' : 'Register'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign supervisor modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <Card className="w-full rounded-b-none rounded-t-2xl shadow-2xl sm:max-w-sm sm:rounded-2xl">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Assign Supervisor</CardTitle>
                <button onClick={() => setAssignTarget(null)} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 pb-6">
              <p className="text-sm text-gray-600">
                Student: <span className="font-medium">{assignTarget.student.name}</span>
              </p>
              <select value={assignSupervisor} onChange={e => setAssignSupervisor(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none">
                <option value="">— Unassigned —</option>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAssignTarget(null)}>Cancel</Button>
                <Button size="sm" disabled={assigning} onClick={handleAssign}>
                  <UserCheck className="h-4 w-4" />
                  {assigning ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No projects registered yet.</p>
          <p className="mt-1 text-xs text-gray-400">Register a project manually or approve a topic proposal.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {projects.map(p => {
              const approved = p.milestones.filter(m => m.status === 'APPROVED').length
              const total = p.milestones.length
              const pct = total > 0 ? Math.round((approved / total) * 100) : 0
              return (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{p.student.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500 truncate">{p.title}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {p.supervisor
                            ? <span className="text-xs text-gray-600">{p.supervisor.name}</span>
                            : <Badge variant="warning">Unassigned</Badge>
                          }
                          <span className="text-xs text-gray-400">· {p.academicYear}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{pct}%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setAssignTarget(p); setAssignSupervisor(p.supervisorId ?? '') }}
                        className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
                        title="Assign supervisor"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3 text-left">Student</th>
                      <th className="px-5 py-3 text-left">Title</th>
                      <th className="px-5 py-3 text-left">Year</th>
                      <th className="px-5 py-3 text-left">Supervisor</th>
                      <th className="px-5 py-3 text-left">Progress</th>
                      <th className="px-5 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map(p => {
                      const approved = p.milestones.filter(m => m.status === 'APPROVED').length
                      const total = p.milestones.length
                      const pct = total > 0 ? Math.round((approved / total) * 100) : 0
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">{p.student.name}</td>
                          <td className="max-w-xs px-5 py-3 truncate text-gray-600">{p.title}</td>
                          <td className="px-5 py-3 text-gray-500">{p.academicYear}</td>
                          <td className="px-5 py-3">
                            {p.supervisor
                              ? <span className="font-medium text-gray-800">{p.supervisor.name}</span>
                              : <Badge variant="warning">Unassigned</Badge>
                            }
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-gray-100">
                                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => { setAssignTarget(p); setAssignSupervisor(p.supervisorId ?? '') }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Supervisor
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
