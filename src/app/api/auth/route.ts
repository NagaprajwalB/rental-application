import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session'
import { logger } from '@/lib/logger'

const bodySchema = z.object({ password: z.string().min(1) })

// Naive in-memory rate limit. Good enough to blunt casual brute-forcing of a
// single-tenant app; on a serverless platform each cold instance starts a fresh
// counter, so for a public multi-instance deployment swap this for Upstash
// Redis or Vercel's built-in rate limiting.
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 }
    )
  }

  const appPassword = process.env.APP_PASSWORD
  const secret = process.env.SESSION_SECRET
  if (!appPassword || !secret) {
    logger.error('Auth misconfigured: APP_PASSWORD or SESSION_SECRET missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  if (parsed.data.password !== appPassword) {
    logger.warn('Failed login attempt', { ip })
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const maxAge = Number(process.env.SESSION_MAX_AGE ?? 604_800)
  const token = await createSessionToken(secret, maxAge)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
