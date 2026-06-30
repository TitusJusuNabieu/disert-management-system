import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BookOpen, CheckCircle2, ArrowRight, BarChart3, Lightbulb } from 'lucide-react'
import { siteConfig } from '@/lib/config'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const [students, supervisors, projects, pendingTopics] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'SUPERVISOR' } }),
    prisma.project.count(),
    prisma.topic.count({ where: { status: 'PENDING' } }),
  ])

  const milestones = await prisma.milestone.groupBy({
    by: ['status'],
    _count: true,
  })

  const statusCounts = Object.fromEntries(milestones.map(m => [m.status, m._count]))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">System-wide overview for the {siteConfig.department} department.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Students', value: students, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: 'Supervisors', value: supervisors, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Projects', value: projects, icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
          { label: 'Approved Milestones', value: statusCounts['APPROVED'] ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Milestone breakdown + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Milestone Status Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { status: 'PENDING', label: 'Pending', color: 'bg-gray-200' },
              { status: 'SUBMITTED', label: 'Submitted', color: 'bg-blue-400' },
              { status: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-yellow-400' },
              { status: 'APPROVED', label: 'Approved', color: 'bg-green-500' },
              { status: 'REJECTED', label: 'Rejected', color: 'bg-red-400' },
            ].map(({ status, label, color }) => {
              const count = statusCounts[status] ?? 0
              const total = milestones.reduce((a, m) => a + m._count, 0) || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: '/admin/topics', label: 'Review Topic Submissions', icon: Lightbulb, desc: 'Approve or reject student project topics', badge: pendingTopics > 0 ? pendingTopics : null },
              { href: '/admin/users', label: 'Manage Users', icon: Users, desc: 'Add, edit, or remove students and supervisors', badge: null },
              { href: '/admin/dissertations', label: 'Project Registry', icon: BookOpen, desc: 'Register projects and assign supervisors', badge: null },
              { href: '/admin/reports', label: 'View Reports', icon: BarChart3, desc: 'Project progress reports', badge: null },
            ].map(({ href, label, icon: Icon, desc, badge }) => (
              <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      {badge !== null && <Badge variant="danger">{badge} pending</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
