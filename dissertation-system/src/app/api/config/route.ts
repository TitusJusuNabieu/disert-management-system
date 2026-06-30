import { handleApiError } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import { siteConfig } from '@/lib/config'

export async function GET() {
  return NextResponse.json(siteConfig)
}
