// Lightweight signed-cookie "session" for a single-tenant app.
//
// This intentionally is not a full auth system (no users table, no OAuth) — the app is
// designed for one owner. The cookie just proves "this browser presented APP_PASSWORD
// before its expiry", signed with HMAC-SHA256 so it can't be forged or extended by
// tampering with the client. Uses Web Crypto so it works in both the Node and Edge
// (middleware) runtimes without extra dependencies.

const encoder = new TextEncoder()

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const SESSION_COOKIE_NAME = 'ledger_session'

export async function createSessionToken(secret: string, maxAgeSeconds: number): Promise<string> {
  const expiresAt = Date.now() + maxAgeSeconds * 1000
  const payload = JSON.stringify({ exp: expiresAt })
  const payloadB64 = toBase64Url(encoder.encode(payload).buffer as ArrayBuffer)

  const key = await getKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64))
  const signatureB64 = toBase64Url(signature)

  return `${payloadB64}.${signatureB64}`
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false
  const [payloadB64, signatureB64] = token.split('.')
  if (!payloadB64 || !signatureB64) return false

  try {
    const key = await getKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signatureB64),
      encoder.encode(payloadB64)
    )
    if (!valid) return false

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)))
    return typeof payload.exp === 'number' && Date.now() < payload.exp
  } catch {
    return false
  }
}
