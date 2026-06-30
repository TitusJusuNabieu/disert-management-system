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

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const projects = await prisma.project.findMany({
      include: {
        student: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        milestones: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { title, abstract, department, academicYear, studentId, supervisorId } = await req.json()

    if (!title?.trim() || !studentId || !academicYear?.trim()) {
      return NextResponse.json({ error: 'Title, student, and academic year are required.' }, { status: 400 })
    }

    const student = await prisma.user.findUnique({ where: { id: studentId, role: 'STUDENT' } })
    if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })

    const existing = await prisma.project.findUnique({ where: { studentId } })
    if (existing) return NextResponse.json({ error: 'This student already has a registered project.' }, { status: 409 })

    const weeksFromNow = (n: number) => new Date(Date.now() + n * 7 * 24 * 60 * 60 * 1000)

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        abstract: abstract?.trim() || null,
        department: department?.trim() || siteConfig.department,
        academicYear: academicYear.trim(),
        studentId,
        supervisorId: supervisorId || null,
        milestones: {
          create: DEFAULT_MILESTONES.map((m, i) => ({
            ...m,
            status: 'PENDING',
            dueDate: weeksFromNow((i + 1) * 2),
          })),
        },
      },
      include: {
        student: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true } },
        milestones: true,
      },
    })

    return NextResponse.json(project)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
