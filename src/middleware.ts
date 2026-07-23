import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session'

export const config = {
  // Protect every route except the login page itself, its API, static assets, and Next internals.
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(request: NextRequest) {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    // Fail closed: a misconfigured deployment should not silently become public.
    return new NextResponse('Server misconfigured: SESSION_SECRET is not set.', { status: 500 })
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isValid = await verifySessionToken(token, secret)

  if (!isValid) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
