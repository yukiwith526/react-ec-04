const encoder = new TextEncoder()

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && password.length <= 72 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export function timingSafeEqual(left: string, right: string) {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  const len = Math.max(a.length, b.length, 1)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function toB64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export function fromB64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

export function toB64Url(bytes: Uint8Array) {
  return toB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  )
  return `${toB64(salt)}:${toB64(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, stored: string) {
  const [saltB64, hashB64] = stored.split(':')
  if (!saltB64 || !hashB64) return false
  const next = await hashPassword(password, fromB64(saltB64))
  return timingSafeEqual(next, stored)
}

export function clientIp(request: Request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown'
}

export type RateLimitRow = { count: number; reset_at: number }

export function decideRateLimit(
  row: RateLimitRow | null,
  now: number,
  limit: number,
  windowMs: number,
) {
  if (!row || row.reset_at <= now) {
    return { action: 'reset' as const, count: 1, reset_at: now + windowMs }
  }
  if (row.count >= limit) {
    return {
      action: 'block' as const,
      retryAfterSec: Math.max(1, Math.ceil((row.reset_at - now) / 1000)),
    }
  }
  return { action: 'hit' as const, count: row.count + 1, reset_at: row.reset_at }
}

export function rateLimitUserMessage(kind: 'register' | 'login' | 'verify', retryAfterSec: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60))
  const label = kind === 'register' ? '会員登録' : kind === 'login' ? 'ログイン' : 'メール確認'
  return `${label}の試行回数が上限です。約${minutes}分後に再度お試しください。`
}
