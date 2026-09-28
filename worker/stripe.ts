const encoder = new TextEncoder()

export type StripeCheckoutSession = {
  id: string
  url: string | null
  status: string | null
  payment_status: string | null
  currency?: string | null
  amount_total?: number | null
  client_reference_id?: string | null
  payment_intent: string | { id: string } | null
  metadata: Record<string, string> | null
}

type StripeErrorBody = {
  error?: { message?: string; code?: string }
}

export type StripeSecretKind = 'sandbox' | 'live' | 'missing' | 'invalid'

export type FulfillDecision = 'paid' | 'cancel' | 'pending' | 'reject'

const SANDBOX_SECRET = /^(?:sk_test_|rk_test_|rkcs_test_)[A-Za-z0-9]+$/
const LIVE_SECRET = /^(?:sk_live_|rk_live_)/
const CHECKOUT_SESSION_TTL_SEC = 30 * 60

export class StripeRequestError extends Error {
  readonly stripeCode: string

  constructor(stripeCode: string) {
    super(stripeCode)
    this.name = 'StripeRequestError'
    this.stripeCode = stripeCode
  }
}

export function classifyStripeSecret(secret: string | undefined): StripeSecretKind {
  const key = secret?.trim() ?? ''
  if (!key || key.includes('replace_me') || key.includes('your_key')) return 'missing'
  if (LIVE_SECRET.test(key)) return 'live'
  if (SANDBOX_SECRET.test(key) && key.length >= 24) return 'sandbox'
  return 'invalid'
}

export function publicStripeFailure(error: unknown) {
  const stripeCode = error instanceof StripeRequestError ? error.stripeCode : ''
  if (stripeCode === 'api_key_expired') {
    return {
      status: 502,
      code: 'STRIPE_KEY_EXPIRED',
      message: 'StripeサンドボックスのAPIキーの期限が切れています。新しいテスト用シークレットキーを設定してから、もう一度お試しください。',
    }
  }
  if (stripeCode === 'live_key_refused') {
    return {
      status: 500,
      code: 'STRIPE_LIVE_KEY',
      message: '本番用のStripeキーは使えません。サンドボックスのテストキーを設定してください。',
    }
  }
  if (stripeCode === 'missing_key' || stripeCode === 'invalid_key') {
    return {
      status: 501,
      code: 'STRIPE_NOT_CONFIGURED',
      message: 'Stripeのサンドボックスキーが設定されていません。',
    }
  }
  return {
    status: 502,
    code: 'STRIPE_ERROR',
    message: '決済の開始に失敗しました。しばらくしてからもう一度お試しください。',
  }
}

export function isStripeCheckoutUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com'
  } catch {
    return false
  }
}

export function decideFulfillment(
  session: StripeCheckoutSession,
  order: { id: string; total: number; sessionId?: string | null },
): FulfillDecision {
  if (order.sessionId && session.id && order.sessionId !== session.id) return 'reject'
  const metaId = session.metadata?.order_id
  const refId = session.client_reference_id
  if (metaId && metaId !== order.id) return 'reject'
  if (refId && refId !== order.id) return 'reject'
  if (!metaId && !refId) return 'reject'
  if (session.currency?.toLowerCase() !== 'jpy') return 'reject'
  if (session.amount_total !== order.total) return 'reject'
  if (session.payment_status === 'paid' && session.status === 'complete') return 'paid'
  if (session.status === 'expired') return 'cancel'
  return 'pending'
}

function paymentIntentId(session: StripeCheckoutSession) {
  if (!session.payment_intent) return null
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
}

export function stripePaymentIntentId(session: StripeCheckoutSession) {
  return paymentIntentId(session)
}

function requireSandboxSecret(secret: string) {
  const kind = classifyStripeSecret(secret)
  if (kind === 'sandbox') return secret.trim()
  if (kind === 'live') throw new StripeRequestError('live_key_refused')
  if (kind === 'missing') throw new StripeRequestError('missing_key')
  throw new StripeRequestError('invalid_key')
}

async function stripeRequest<T>(
  secret: string,
  method: string,
  path: string,
  params?: Record<string, string>,
  idempotencyKey?: string,
) {
  const key = requireSandboxSecret(secret)
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` }
  if (params) headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body: params ? new URLSearchParams(params) : undefined,
  })
  const data = (await response.json()) as T & StripeErrorBody
  if (!response.ok) {
    const stripeCode = data.error?.code || 'stripe_error'
    console.error(JSON.stringify({ level: 'error', event: 'stripe', path, status: response.status, code: stripeCode }))
    throw new StripeRequestError(stripeCode)
  }
  return data as T
}

export async function createStripeCheckoutSession(
  secret: string,
  params: {
    orderId: string
    email: string
    successUrl: string
    cancelUrl: string
    lineItems: { name: string; amount: number; quantity: number; image?: string }[]
  },
) {
  const body: Record<string, string> = {
    mode: 'payment',
    locale: 'ja',
    customer_email: params.email,
    client_reference_id: params.orderId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_creation: 'always',
    expires_at: String(Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SEC),
    'metadata[order_id]': params.orderId,
    'payment_intent_data[metadata][order_id]': params.orderId,
    'payment_intent_data[receipt_email]': params.email,
  }

  params.lineItems.forEach((item, index) => {
    body[`line_items[${index}][quantity]`] = String(item.quantity)
    body[`line_items[${index}][price_data][currency]`] = 'jpy'
    body[`line_items[${index}][price_data][unit_amount]`] = String(item.amount)
    body[`line_items[${index}][price_data][product_data][name]`] = item.name.slice(0, 120)
    if (item.image?.startsWith('https://')) {
      body[`line_items[${index}][price_data][product_data][images][0]`] = item.image
    }
  })

  const session = await stripeRequest<StripeCheckoutSession>(
    secret,
    'POST',
    '/checkout/sessions',
    body,
    `checkout-${params.orderId}`,
  )
  if (!isStripeCheckoutUrl(session.url)) throw new StripeRequestError('invalid_checkout_url')
  return session
}

export async function retrieveStripeCheckoutSession(secret: string, sessionId: string) {
  return stripeRequest<StripeCheckoutSession>(
    secret,
    'GET',
    `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=payment_intent`,
  )
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string) {
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  if (left.byteLength !== right.byteLength) return false
  let diff = 0
  for (let i = 0; i < left.byteLength; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

export async function verifyStripeWebhook(payload: string, signatureHeader: string, secret: string) {
  if (!secret.startsWith('whsec_') || secret.length < 16 || payload.length === 0 || payload.length > 200_000) {
    return false
  }
  const signatures: string[] = []
  let timestamp = ''
  for (const part of signatureHeader.split(',')) {
    const [key, ...rest] = part.split('=')
    const value = rest.join('=')
    if (key === 't') timestamp = value
    if (key === 'v1' && value) signatures.push(value)
  }
  if (!timestamp || signatures.length === 0) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  const actual = hex(mac)
  return signatures.some((signature) => safeEqual(actual, signature))
}

export type StripeEvent = {
  type: string
  data: { object: StripeCheckoutSession }
}
