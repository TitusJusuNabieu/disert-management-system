import { NextResponse } from 'next/server'

type PrismaError = { code?: string }

export function handleApiError(err: unknown, label: string): NextResponse {
  console.error(`[${label}]`, err)
  const code = (err as PrismaError).code
  if (code === 'P2003') {
    return NextResponse.json(
      { error: 'Your session has expired. Please sign out and sign in again.', reauth: true },
      { status: 401 }
    )
  }
  if (code === 'P2025') {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
