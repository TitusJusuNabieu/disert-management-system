import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, studentId: true, department: true, createdAt: true },
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { name, email, role, studentId, department, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const conflict = await prisma.user.findFirst({ where: { email, NOT: { id } } })
    if (conflict) return NextResponse.json({ error: 'Email already in use by another user' }, { status: 409 })

    const data: Record<string, string | null> = {
      name: name.trim(),
      email: email.trim(),
      role: role as Role,
      studentId: studentId?.trim() || null,
      department: department?.trim() || null,
    }

    if (password?.trim()) {
      if (password.trim().length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      data.password = await bcrypt.hash(password.trim(), 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, studentId: true, department: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    if (id === session.user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
