import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role === 'STUDENT') {
      const topics = await prisma.topic.findMany({
        where: { studentId: session.user.id },
        include: {
          reviewedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(topics)
    }

    if (session.user.role === 'SUPERVISOR') {
      const projects = await prisma.project.findMany({
        where: { supervisorId: session.user.id },
        select: { studentId: true },
      })
      const studentIds = projects.map(p => p.studentId)

      const topics = await prisma.topic.findMany({
        where: { studentId: { in: studentIds.length ? studentIds : ['__none__'] } },
        include: {
          student: { select: { id: true, name: true, studentId: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: [{ studentId: 'asc' }, { createdAt: 'desc' }],
      })
      return NextResponse.json(topics)
    }

    // ADMIN — all topics
    const topics = await prisma.topic.findMany({
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ studentId: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(topics)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit topics.' }, { status: 403 })
    }

    const { title, description, rationale } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const approved = await prisma.topic.findFirst({
      where: { studentId: session.user.id, status: 'APPROVED' },
    })
    if (approved) {
      return NextResponse.json({ error: 'You already have an approved topic. No further submissions needed.' }, { status: 409 })
    }

    const count = await prisma.topic.count({ where: { studentId: session.user.id } })
    if (count >= 3) {
      return NextResponse.json({ error: 'You have reached the maximum of 3 topic proposals. Withdraw a pending one to submit another.' }, { status: 409 })
    }

    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        rationale: rationale?.trim() || null,
        studentId: session.user.id,
      },
      include: { reviewedBy: { select: { id: true, name: true, role: true } } },
    })

    return NextResponse.json(topic)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
