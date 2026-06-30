import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { siteConfig } from '@/lib/config'

const DEFAULT_MILESTONES = [
  { name: 'Proposal Submission',   order: 1, description: 'Submit your project proposal for approval.' },
  { name: 'Literature Review',     order: 2, description: 'Submit your literature review chapter.' },
  { name: 'Methodology',           order: 3, description: 'Submit your research methodology chapter.' },
  { name: 'Data Collection',       order: 4, description: 'Submit evidence of data collection.' },
  { name: 'Analysis & Discussion', order: 5, description: 'Submit your analysis and discussion chapters.' },
  { name: 'Final Write-up',        order: 6, description: 'Submit the complete final write-up for review.' },
  { name: 'Defense Preparation',   order: 7, description: 'Confirm readiness for defense presentation.' },
]

// PATCH /api/topics/[id]  — approve or reject a topic (supervisor or admin/HOD)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { status, reviewNote } = await req.json()

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be APPROVED or REJECTED.' }, { status: 400 })
    }

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: { student: true },
    })
    if (!topic) return NextResponse.json({ error: 'Topic not found.' }, { status: 404 })

    if (status === 'APPROVED') {
      const existingApproved = await prisma.topic.findFirst({
        where: { studentId: topic.studentId, status: 'APPROVED', id: { not: id } },
      })
      if (existingApproved) {
        return NextResponse.json({ error: 'This student already has an approved topic.' }, { status: 409 })
      }
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote?.trim() || null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true, department: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    })

    if (status === 'APPROVED') {
      const existing = await prisma.project.findUnique({ where: { studentId: topic.studentId } })
      if (!existing) {
        const weeksFromNow = (n: number) => new Date(Date.now() + n * 7 * 24 * 60 * 60 * 1000)
        await prisma.project.create({
          data: {
            title: topic.title,
            abstract: topic.description || null,
            department: topic.student.department || siteConfig.department,
            academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
            studentId: topic.studentId,
            topicId: topic.id,
            milestones: {
              create: DEFAULT_MILESTONES.map((m, i) => ({
                ...m,
                status: 'PENDING',
                dueDate: weeksFromNow((i + 1) * 2),
              })),
            },
          },
        })
      } else if (!existing.topicId) {
        await prisma.project.update({
          where: { id: existing.id },
          data: { title: topic.title, topicId: topic.id },
        })
      }
    }

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

// DELETE — student withdraws a pending topic
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const topic = await prisma.topic.findUnique({ where: { id } })

    if (!topic) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    if (topic.studentId !== session.user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    if (topic.status !== 'PENDING') return NextResponse.json({ error: 'Only pending topics can be withdrawn.' }, { status: 400 })

    await prisma.topic.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
