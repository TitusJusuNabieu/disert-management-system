import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const projects = await prisma.project.findMany({
    include: {
      student: { select: { name: true, studentId: true } },
      supervisor: { select: { name: true } },
      milestones: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Project Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Progress overview for all registered student projects.</p>
      </div>

      <div className="space-y-4">
        {projects.map(p => {
          const approved = p.milestones.filter(m => m.status === 'APPROVED').length
          const total = p.milestones.length
          const progress = total > 0 ? Math.round((approved / total) * 100) : 0
          const statusBadge = progress === 100 ? 'success' : progress > 50 ? 'default' : 'ghost'

          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-sm leading-snug sm:text-base">{p.title}</CardTitle>
                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                      {p.student.name} ({p.student.studentId ?? 'N/A'}) · Supervisor: {p.supervisor?.name ?? 'Unassigned'}
                    </p>
                  </div>
                  <Badge variant={statusBadge as 'default' | 'success' | 'ghost'} className="shrink-0 self-start">{progress}% complete</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {p.milestones.map(m => {
                    const color =
                      m.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      m.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                      m.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    return (
                      <span key={m.id} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                        {m.name}
                      </span>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {projects.length === 0 && (
          <p className="text-sm text-gray-500">No projects registered yet.</p>
        )}
      </div>
    </div>
  )
}
