import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, MessageSquare, CheckCircle2, Clock, ArrowRight, Lightbulb } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SubmitMilestoneButton } from '@/components/milestones/submit-button'

export default async function StudentDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const project = await prisma.project.findUnique({
    where: { studentId: session.user.id },
    include: {
      supervisor: { select: { id: true, name: true, email: true } },
      milestones: { orderBy: { order: 'asc' } },
    },
  })

  // Check if student has any topics at all
  const topicCount = await prisma.topic.count({ where: { studentId: session.user.id } })
  const approvedTopic = await prisma.topic.findFirst({
    where: { studentId: session.user.id, status: 'APPROVED' },
  })

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Lightbulb className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No project registered yet</h2>
          {approvedTopic ? (
            <p className="mt-2 text-sm text-gray-500">Your topic was approved. The department admin will assign a supervisor and register your project shortly.</p>
          ) : topicCount > 0 ? (
            <p className="mt-2 text-sm text-gray-500">Your topic proposals are under review. You will be notified once one is approved.</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Start by submitting your project topic proposals.{' '}
              <Link href="/student/topics" className="font-medium text-blue-600 hover:underline">Submit a topic →</Link>
            </p>
          )}
        </div>
      </div>
    )
  }

  const approved = project.milestones.filter(m => m.status === 'APPROVED').length
  const submitted = project.milestones.filter(m => m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW').length
  const pendingMilestones = project.milestones.filter(m => m.status === 'PENDING')
  const progress = project.milestones.length > 0 ? Math.round((approved / project.milestones.length) * 100) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Welcome back, {session.user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your project progress.</p>
      </div>

      {/* Project info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-gray-500">Department</p>
              <p className="font-medium text-gray-900">{project.department}</p>
            </div>
            <div>
              <p className="text-gray-500">Academic Year</p>
              <p className="font-medium text-gray-900">{project.academicYear}</p>
            </div>
            <div>
              <p className="text-gray-500">Supervisor</p>
              <p className="font-medium text-gray-900">{project.supervisor?.name ?? 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-gray-500">Progress</p>
              <p className="font-semibold text-blue-700">{progress}%</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full rounded-full bg-gray-100">
            <div className="h-2.5 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'In Review', value: submitted, icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: pendingMilestones.length, icon: BookOpen, color: 'text-gray-600 bg-gray-50' },
          { label: 'Total', value: project.milestones.length, icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
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

      {/* Submit work */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submit Work</CardTitle>
              <Link href="/student/milestones" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">All caught up!</p>
                <p className="text-xs text-gray-400">No pending submissions right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMilestones.map((m, i) => (
                  <div key={m.id} className={`rounded-xl border p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        {m.description && <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>}
                      </div>
                      {i === 0 && <Badge variant="default">Up next</Badge>}
                    </div>
                    {m.dueDate && (
                      <p className="mb-3 text-xs text-orange-600">Due: {formatDate(m.dueDate)}</p>
                    )}
                    <SubmitMilestoneButton milestoneId={m.id} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link href="/student/topics" className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">My Project Topics</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/student/milestones" className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Track All Milestones</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/student/feedback" className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">View Supervisor Feedback</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
