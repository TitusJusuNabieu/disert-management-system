'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Plus, X, Check, Pencil, Trash2, AlertCircle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  studentId: string | null
  department: string | null
  createdAt: string
}

const ROLE_VARIANTS: Record<string, 'default' | 'success' | 'warning'> = {
  STUDENT: 'default', SUPERVISOR: 'success', ADMIN: 'warning',
}

const emptyForm = { name: '', email: '', password: '', role: 'STUDENT', studentId: '', department: '' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) return
      const u = await res.json()
      setUsers(Array.isArray(u) ? u : [])
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  function openCreate() {
    setEditUser(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, studentId: u.studentId ?? '', department: u.department ?? '' })
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditUser(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
    const method = editUser ? 'PUT' : 'POST'
    const body = editUser
      ? { name: form.name, email: form.email, role: form.role, studentId: form.studentId, department: form.department, ...(form.password ? { password: form.password } : {}) }
      : form
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (res.ok) {
      closeForm()
      await fetchData()
      showToast('success', editUser ? `${data.name} updated.` : `${data.name} created.`)
    } else {
      setFormError(data.error ?? 'Something went wrong.')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('success', `${deleteTarget.name} deleted.`)
      setDeleteTarget(null)
      await fetchData()
    } else {
      const data = await res.json()
      showToast('error', data.error ?? 'Failed to delete user.')
    }
    setDeleting(false)
  }

  const filtered = filter === 'ALL' ? users : users.filter(u => u.role === filter)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-4 z-50 flex max-w-xs items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:right-5 ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {toast.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">User Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">{users.length} registered users across all roles.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <Card className="w-full max-h-[90vh] overflow-y-auto rounded-b-none rounded-t-2xl shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <CardHeader className="sticky top-0 bg-white z-10 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{editUser ? 'Edit User' : 'Create New User'}</CardTitle>
                <button onClick={closeForm} className="rounded p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Full Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Password {editUser ? '(leave blank to keep)' : '*'}
                    </label>
                    <input type="password" required={!editUser} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editUser ? 'Leave blank to keep current' : 'Min. 8 characters'}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Role *</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none">
                      <option value="STUDENT">Student</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g. Computer Science"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                  </div>
                  {form.role === 'STUDENT' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Student ID</label>
                      <input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                        placeholder="e.g. NJU/CS/2022/001"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none" />
                    </div>
                  )}
                </div>
                {formError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    <Check className="h-4 w-4" />
                    {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <Card className="w-full rounded-b-none rounded-t-2xl shadow-2xl sm:max-w-sm sm:rounded-2xl">
            <CardContent className="pt-6 pb-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Delete {deleteTarget.name}?</p>
                  <p className="text-sm text-gray-500">This cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', 'STUDENT', 'SUPERVISOR', 'ADMIN'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === r ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {r === 'ALL' ? `All (${users.length})` : `${r.charAt(0) + r.slice(1).toLowerCase()}s (${users.filter(u => u.role === r).length})`}
          </button>
        ))}
      </div>

      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">No users found.</p>
        )}
        {filtered.map(u => (
          <Card key={u.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{u.name}</p>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                    {(u.studentId || u.department) && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">{u.studentId ?? u.department}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={ROLE_VARIANTS[u.role] ?? 'ghost'}>
                    {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                  </Badge>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">ID / Dept.</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={ROLE_VARIANTS[u.role] ?? 'ghost'}>
                        {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{u.studentId ?? u.department ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(u)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
