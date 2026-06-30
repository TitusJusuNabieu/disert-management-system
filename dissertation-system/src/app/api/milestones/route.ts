import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { studentId: session.user.id },
      include: {
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
    })

    return NextResponse.json(project)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
