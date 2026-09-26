import { SignJWT, jwtVerify } from 'jose'
import { jsonError } from './auth'
import {
  clientIp,
  decideRateLimit,
  hashPassword,
  isStrongPassword,
  isValidEmail,
  rateLimitUserMessage,
  sha256Hex,
  verifyPassword,
} from './auth-crypto'
import { isResendTestMode, sendAlreadyMemberEmail, sendMemberVerification } from './email'
import type { Env } from './types'

export type Member = {
  id: string
  email: string
  name: string
  zip: string
  address: string
}

const COOKIE = 'fl_member'
const encoder = new TextEncoder()
const PENDING_MESSAGE = 'ご入力のメールアドレス宛に確認メールを送りました。届いたリンクを開いて登録を完了してください。'
const TEST_MODE_MESSAGE =
  'Resend はテストモードのため、確認メールは実際には送信されません。登録したメールアドレスとパスワードでログインへお進みください。'
const TEST_MODE_EXISTING_MESSAGE =
  'このメールアドレスは登録済みです。Resend のテスト送信では案内メールは届きません。ログインへお進みください。'

let dummyHashPromise: Promise<string> | null = null

function dummyHash() {
  dummyHashPromise ??= hashPassword('not-a-real-account-placeholder')
  return dummyHashPromise
}

function cookieOptions(request: Request, maxAge: number) {
  const secure = new URL(request.url).protocol === 'https:'
  return ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`, secure ? 'Secure' : '']
    .filter(Boolean)
    .join('; ')
}

function cookieValue(request: Request, name: string) {
  const raw = request.headers.get('Cookie') ?? ''
  const match = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function secretKey(env: Env) {
  const secret = env.MEMBER_JWT_SECRET?.trim() ?? ''
  if (!secret) throw new Error('MEMBER_JWT_SECRET is not configured')
  return encoder.encode(secret)
}

async function signMember(env: Env, member: Member) {
  return new SignJWT({ email: member.email, name: member.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(member.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey(env))
}

function memberResponse(member: Member, request: Request, token: string, status = 200) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(request, 60 * 60 * 24 * 7)}`,
  )
  return new Response(JSON.stringify({ member }), { status, headers })
}

function clearCookie(request: Request) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', `${COOKIE}=; ${cookieOptions(request, 0)}`)
  return new Response(JSON.stringify({ ok: true }), { headers })
}

function pendingResponse(extra?: {
  verifyUrl?: string
  emailTestMode?: boolean
  canLogin?: boolean
  message?: string
}) {
  return Response.json(
    {
      pending: !extra?.canLogin,
      message: extra?.message ?? PENDING_MESSAGE,
      ...extra,
    },
    { status: 201 },
  )
}

async function loadMember(env: Env, id: string) {
  const row = await env.DB.prepare(
    'SELECT id, email, name, zip, address, email_verified_at FROM customers WHERE id = ?',
  )
    .bind(id)
    .first<Member & { email_verified_at: string | null }>()
  if (!row?.email_verified_at) return null
  return { id: row.id, email: row.email, name: row.name, zip: row.zip, address: row.address }
}

export async function getMember(request: Request, env: Env): Promise<Member | null> {
  const token = cookieValue(request, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(env))
    if (typeof payload.sub !== 'string') return null
    return loadMember(env, payload.sub)
  } catch {
    return null
  }
}

async function assertRateLimit(
  env: Env,
  bucket: string,
  limit: number,
  windowMs: number,
  kind: 'register' | 'login' | 'verify',
) {
  const now = Date.now()
  const row = await env.DB.prepare('SELECT count, reset_at FROM auth_rate_limits WHERE bucket = ?')
    .bind(bucket)
    .first<{ count: number; reset_at: number }>()
  const decision = decideRateLimit(row, now, limit, windowMs)
  if (decision.action === 'reset') {
    await env.DB.prepare('INSERT OR REPLACE INTO auth_rate_limits (bucket, count, reset_at) VALUES (?, ?, ?)')
      .bind(bucket, decision.count, decision.reset_at)
      .run()
    return null
  }
  if (decision.action === 'block') {
    const message = rateLimitUserMessage(kind, decision.retryAfterSec)
    return new Response(JSON.stringify({ error: message, code: 'RATE_LIMITED', retryAfterSec: decision.retryAfterSec }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(decision.retryAfterSec),
      },
    })
  }
  await env.DB.prepare('UPDATE auth_rate_limits SET count = ? WHERE bucket = ?').bind(decision.count, bucket).run()
  return null
}

function parseAuthBody(body: unknown, requireName: boolean) {
  if (!body || typeof body !== 'object') return jsonError('Invalid JSON body', 400)
  const data = body as Record<string, unknown>
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const password = typeof data.password === 'string' ? data.password : ''
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const zip = typeof data.zip === 'string' ? data.zip.trim() : ''
  const address = typeof data.address === 'string' ? data.address.trim() : ''
  if (!isValidEmail(email)) return jsonError('email is invalid', 400)
  if (requireName && (!name || name.length > 80)) return jsonError('name is required', 400)
  if (requireName && !isStrongPassword(password)) {
    return jsonError('password must be 8 characters or more and include a letter and a number', 400)
  }
  if (!requireName && (password.length < 1 || password.length > 72)) {
    return jsonError('メールアドレスまたはパスワードが正しくありません', 401, 'LOGIN_FAILED')
  }
  if (zip.length > 16 || address.length > 200) return jsonError('address is invalid', 400)
  return { email, password, name, zip, address }
}

async function issueVerifyToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const token = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return { token, tokenHash: await sha256Hex(token) }
}

function normalizeToken(token: string) {
  return token.replace(/\s+/g, '').replace(/^['"]|['"]$/g, '')
}

function verifyUrl(request: Request, token: string) {
  const origin = new URL(request.url).origin
  return `${origin}/verify-email/${token}`
}

export async function registerMember(request: Request, env: Env) {
  const limited = await assertRateLimit(env, `register:${clientIp(request)}`, 20, 60 * 60 * 1000, 'register')
  if (limited) return limited

  const parsed = parseAuthBody(await request.json().catch(() => null), true)
  if (parsed instanceof Response) return parsed

  const existing = await env.DB.prepare(
    'SELECT id, password_hash, email_verified_at FROM customers WHERE email = ?',
  )
    .bind(parsed.email)
    .first<{ id: string; password_hash: string | null; email_verified_at: string | null }>()

  const testMode = await isResendTestMode(env)

  if (existing?.email_verified_at) {
    await sendAlreadyMemberEmail(env, parsed.email, parsed.name || existing.id)
    return pendingResponse(
      testMode
        ? { emailTestMode: true, canLogin: true, message: TEST_MODE_EXISTING_MESSAGE }
        : undefined,
    )
  }

  const { token, tokenHash } = await issueVerifyToken()
  const now = new Date()
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const passwordHash = await hashPassword(parsed.password)

  await env.DB.prepare(
    `INSERT INTO pending_signups (email, name, zip, address, password_hash, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       zip = excluded.zip,
       address = excluded.address,
       password_hash = excluded.password_hash,
       token_hash = excluded.token_hash,
       expires_at = excluded.expires_at,
       created_at = excluded.created_at,
       consumed_at = NULL,
       customer_id = NULL`,
  )
    .bind(parsed.email, parsed.name, parsed.zip, parsed.address, passwordHash, tokenHash, expires, now.toISOString())
    .run()

  const sent = await sendMemberVerification(env, parsed.email, parsed.name, verifyUrl(request, token))
  const resendTestingOnly = !sent.ok && /only send testing emails to your own/i.test(sent.error)
  const allowWithoutInbox = testMode || resendTestingOnly || env.ENVIRONMENT === 'development'

  if (!sent.ok && !allowWithoutInbox) {
    await env.DB.prepare('DELETE FROM pending_signups WHERE email = ?').bind(parsed.email).run()
    const detail = sent.error ?? ''
    const message = /domain is not verified/i.test(detail)
      ? 'mail.fleurlumiere.jp は Resend に追加済みですが、DNS 認証がまだ完了していません。Resend の Domains 画面のレコードを DNS に入れ、Verify してください。'
      : /API key is invalid/i.test(detail)
        ? '確認メールを送れませんでした。Resend API キーが無効です。'
        : '確認メールを送れませんでした。時間をおいて再度お試しください。'
    return jsonError(message, 503, 'EMAIL_UNAVAILABLE')
  }

  if (allowWithoutInbox) {
    const member = await consumeVerificationToken(env, token)
    if (member) {
      return pendingResponse({
        emailTestMode: true,
        canLogin: true,
        message: TEST_MODE_MESSAGE,
      })
    }
    return pendingResponse({
      emailTestMode: true,
      canLogin: false,
      verifyUrl: verifyUrl(request, token),
      message: TEST_MODE_MESSAGE,
    })
  }

  return pendingResponse()
}

export async function loginMember(request: Request, env: Env) {
  const limited = await assertRateLimit(env, `login:${clientIp(request)}`, 10, 15 * 60 * 1000, 'login')
  if (limited) return limited

  const parsed = parseAuthBody(await request.json().catch(() => null), false)
  if (parsed instanceof Response) return parsed

  const row = await env.DB.prepare(
    'SELECT id, password_hash, email_verified_at FROM customers WHERE email = ?',
  )
    .bind(parsed.email)
    .first<{ id: string; password_hash: string | null; email_verified_at: string | null }>()

  const ok = await verifyPassword(parsed.password, row?.password_hash || (await dummyHash()))
  if (!row?.password_hash || !row.email_verified_at) {
    const pending = await env.DB.prepare(
      'SELECT email FROM pending_signups WHERE email = ? AND consumed_at IS NULL',
    )
      .bind(parsed.email)
      .first()
    if (pending) {
      return jsonError(
        'このメールアドレスはまだ確認が完了していません。確認メールのリンクを開くか、会員登録から確認メールを再送してください。',
        401,
        'EMAIL_UNVERIFIED',
      )
    }
    return jsonError('登録されていないメールアドレスです', 401, 'EMAIL_NOT_FOUND')
  }
  if (!ok) {
    return jsonError('メールアドレスまたはパスワードが正しくありません', 401, 'LOGIN_FAILED')
  }

  const member = await loadMember(env, row.id)
  if (!member) return jsonError('メールアドレスまたはパスワードが正しくありません', 401, 'LOGIN_FAILED')
  return memberResponse(member, request, await signMember(env, member))
}

export async function logoutMember(request: Request) {
  return clearCookie(request)
}

export async function currentMember(request: Request, env: Env) {
  const member = await getMember(request, env)
  if (!member) return jsonError('ログインが必要です', 401, 'MEMBER_REQUIRED')
  return Response.json({ member })
}

export async function updateMemberProfile(request: Request, env: Env) {
  const member = await getMember(request, env)
  if (!member) return jsonError('ログインが必要です', 401, 'MEMBER_REQUIRED')
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const name = typeof body?.name === 'string' ? body.name.trim() : member.name
  const zip = typeof body?.zip === 'string' ? body.zip.trim() : member.zip
  const address = typeof body?.address === 'string' ? body.address.trim() : member.address
  if (!name || name.length > 80) return jsonError('name is required', 400)
  if (!zip || zip.length > 16) return jsonError('zip is required', 400)
  if (!address || address.length > 200) return jsonError('address is required', 400)
  const now = new Date().toISOString()
  await env.DB.prepare('UPDATE customers SET name = ?, zip = ?, address = ?, updated_at = ? WHERE id = ?')
    .bind(name, zip, address, now, member.id)
    .run()
  const updated = await loadMember(env, member.id)
  if (!updated) return jsonError('Failed to update member', 500)
  return Response.json({ member: updated })
}

async function consumeVerificationToken(env: Env, rawToken: string) {
  const token = normalizeToken(rawToken)
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const pending = await env.DB.prepare(
    `SELECT email, name, zip, address, password_hash, expires_at, consumed_at, customer_id
     FROM pending_signups WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{
      email: string
      name: string
      zip: string
      address: string
      password_hash: string
      expires_at: string
      consumed_at: string | null
      customer_id: string | null
    }>()
  if (!pending) return null

  if (pending.consumed_at && pending.customer_id) {
    return loadMember(env, pending.customer_id)
  }
  if (pending.expires_at < new Date().toISOString()) return null

  const now = new Date().toISOString()
  const existing = await env.DB.prepare('SELECT id, email_verified_at FROM customers WHERE email = ?')
    .bind(pending.email)
    .first<{ id: string; email_verified_at: string | null }>()

  let id = existing?.id
  if (existing?.email_verified_at) {
    id = existing.id
  } else if (id) {
    await env.DB.prepare(
      `UPDATE customers
       SET password_hash = ?, name = ?, zip = ?, address = ?, email_verified_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(pending.password_hash, pending.name, pending.zip, pending.address, now, now, id)
      .run()
  } else {
    id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO customers (id, email, name, zip, address, password_hash, email_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, pending.email, pending.name, pending.zip, pending.address, pending.password_hash, now, now, now)
      .run()
  }

  await env.DB.prepare(
    `UPDATE pending_signups SET consumed_at = ?, customer_id = ? WHERE token_hash = ?`,
  )
    .bind(now, id, tokenHash)
    .run()
  return loadMember(env, id)
}

export async function verifyMemberEmail(request: Request, env: Env) {
  const limited = await assertRateLimit(env, `verify:${clientIp(request)}`, 30, 60 * 60 * 1000, 'verify')
  if (limited) return limited

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null
  const token = typeof body?.token === 'string' ? normalizeToken(body.token) : ''
  if (!token || token.length > 128) return jsonError('確認リンクが無効です', 400, 'INVALID_TOKEN')

  const member = await consumeVerificationToken(env, token)
  if (!member) {
    return jsonError(
      '確認リンクが無効です。新しい確認メールをもう一度受け取って、そのメール内のボタンから開いてください。',
      400,
      'INVALID_TOKEN',
    )
  }

  return memberResponse(member, request, await signMember(env, member))
}
