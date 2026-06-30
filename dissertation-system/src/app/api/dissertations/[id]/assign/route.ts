import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { supervisorId } = await req.json()

    if (supervisorId) {
      const supervisor = await prisma.user.findUnique({ where: { id: supervisorId, role: 'SUPERVISOR' } })
      if (!supervisor) return NextResponse.json({ error: 'Supervisor not found.' }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: { supervisorId: supervisorId || null },
      include: {
        student: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(project)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
