import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (pathname === '/login') {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      const dest = role === 'ADMIN' ? '/admin' : role === 'SUPERVISOR' ? '/supervisor' : '/student'
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = req.auth?.user?.role
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/supervisor') && role !== 'SUPERVISOR') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
