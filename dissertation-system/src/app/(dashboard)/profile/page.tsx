'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  studentId: string | null
  department: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = { STUDENT: 'Student', SUPERVISOR: 'Supervisor', ADMIN: 'Administrator' }
const ROLE_VARIANTS: Record<string, 'default' | 'success' | 'warning'> = { STUDENT: 'default', SUPERVISOR: 'success', ADMIN: 'warning' }

function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Info form
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [studentId, setStudentId] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile(data)
          setName(data.name ?? '')
          setDepartment(data.department ?? '')
          setStudentId(data.studentId ?? '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, department, studentId }),
    })
    const data = await res.json()
    if (res.ok) {
      setProfile(data)
      showToast('success', 'Profile updated successfully.')
    } else {
      showToast('error', data.error ?? 'Failed to update profile.')
    }
    setSaving(false)
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, department, studentId, currentPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('success', 'Password changed successfully.')
    } else {
      showToast('error', data.error ?? 'Failed to change password.')
    }
    setPwSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account information and password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar / summary */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8 pb-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-3">
              <Badge variant={ROLE_VARIANTS[profile.role] ?? 'ghost'}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
            {profile.department && (
              <p className="mt-3 text-xs text-gray-400">{profile.department}</p>
            )}
            {profile.studentId && (
              <p className="mt-1 text-xs font-mono text-gray-400">{profile.studentId}</p>
            )}
            <p className="mt-4 text-xs text-gray-400">
              Member since {new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        {/* Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInfoSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      value={profile.email}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Department</label>
                    <input
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {profile.role === 'STUDENT' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Student ID</label>
                      <input
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        placeholder="e.g. NJU/CS/2022/001"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <CardTitle>Change Password</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">New Password *</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      placeholder="••••••••"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={pwSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                    <Lock className="h-4 w-4" />
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
