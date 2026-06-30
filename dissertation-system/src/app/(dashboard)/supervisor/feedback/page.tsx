import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default async function SupervisorFeedbackPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPERVISOR') redirect('/login')

  const feedback = await prisma.feedback.findMany({
    where: { authorId: session.user.id },
    include: {
      recipient: { select: { id: true, name: true } },
      milestone: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Feedback Given</h1>
        <p className="mt-1 text-sm text-gray-500">All feedback you've left for your students.</p>
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-gray-500">No feedback given yet.</p>
      ) : (
        <div className="space-y-3">
          {feedback.map(f => (
            <Card key={f.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {f.recipient.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{f.recipient.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.milestone && <Badge variant="ghost">{f.milestone.name}</Badge>}
                    <span className="text-xs text-gray-400">{formatDateTime(f.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">{f.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
