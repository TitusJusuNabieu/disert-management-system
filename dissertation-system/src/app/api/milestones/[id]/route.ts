import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { MilestoneStatus } from '@prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    if (!Object.values(MilestoneStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { role } = session.user
    const allowed =
      (role === 'STUDENT' && milestone.project.studentId === session.user.id && body.status === MilestoneStatus.SUBMITTED) ||
      (role === 'SUPERVISOR' && milestone.project.supervisorId === session.user.id) ||
      role === 'ADMIN'

    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: body.status,
        submittedAt: body.status === MilestoneStatus.SUBMITTED ? new Date() : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
