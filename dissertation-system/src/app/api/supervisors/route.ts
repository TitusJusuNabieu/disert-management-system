import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projects = await prisma.project.findMany({
      where: { supervisorId: session.user.id },
      include: {
        student: { select: { id: true, name: true, email: true, studentId: true } },
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            feedback: {
              include: { author: { select: { id: true, name: true, role: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
