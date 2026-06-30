import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, CheckCircle2, Clock, ArrowRight, Lightbulb } from 'lucide-react'

export default async function SupervisorDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPERVISOR') redirect('/login')

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id },
    include: {
      student: { select: { id: true, name: true, email: true, studentId: true } },
      milestones: true,
    },
  })

  // Topics from assigned students that are still pending
  const studentIds = projects.map(p => p.studentId)
  const pendingTopics = studentIds.length > 0
    ? await prisma.topic.count({ where: { studentId: { in: studentIds }, status: 'PENDING' } })
    : 0

  const totalStudents = projects.length
  const awaitingReview = projects.reduce((acc, p) =>
    acc + p.milestones.filter(m => m.status === 'SUBMITTED').length, 0
  )
  const totalApproved = projects.reduce((acc, p) =>
    acc + p.milestones.filter(m => m.status === 'APPROVED').length, 0
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Welcome, {session.user.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your supervised student projects.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Students', value: totalStudents, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: 'Awaiting Review', value: awaitingReview, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Approved Milestones', value: totalApproved, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
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

      {/* Pending topics alert */}
      {pendingTopics > 0 && (
        <Link href="/supervisor/topics" className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 hover:bg-yellow-100 transition-colors">
          <Lightbulb className="h-5 w-5 shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">
              {pendingTopics} topic proposal{pendingTopics !== 1 ? 's' : ''} awaiting your review
            </p>
            <p className="text-xs text-yellow-700">Click to review and approve or reject submissions.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-yellow-600" />
        </Link>
      )}

      {/* Student list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Students</CardTitle>
            <Link href="/supervisor/students" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-500">No students assigned yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map(p => {
                const approved = p.milestones.filter(m => m.status === 'APPROVED').length
                const pending = p.milestones.filter(m => m.status === 'SUBMITTED').length
                const progress = p.milestones.length > 0 ? Math.round((approved / p.milestones.length) * 100) : 0
                return (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {p.student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.student.name}</p>
                        <p className="text-xs text-gray-500">{p.student.studentId ?? p.student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pending > 0 && <Badge variant="warning">{pending} to review</Badge>}
                      <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
