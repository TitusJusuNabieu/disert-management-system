import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, studentId: true, department: true, createdAt: true },
    })

    return NextResponse.json(user)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, department, studentId, currentPassword, newPassword } = await req.json()

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const data: Record<string, string | null> = {
      name: name.trim(),
      department: department?.trim() || null,
    }

    if (session.user.role === 'STUDENT' && studentId !== undefined) {
      data.studentId = studentId?.trim() || null
    }

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Current password is required to set a new one' }, { status: 400 })
      if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      data.password = await bcrypt.hash(newPassword, 10)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, studentId: true, department: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
