import { handleApiError } from '@/lib/api-error'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, milestoneId, recipientId } = await req.json()

    if (!content?.trim() || !milestoneId || !recipientId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        recipientId,
        milestoneId,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json(feedback)
  } catch (err) {
    return handleApiError(err, 'api')
  }
}
