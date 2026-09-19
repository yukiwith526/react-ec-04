const encoder = new TextEncoder()

export type StripeCheckoutSession = {
  id: string
  url: string | null
  status: string | null
  payment_status: string | null
  payment_intent: string | { id: string } | null
  metadata: Record<string, string> | null
}

type StripeErrorBody = {
  error?: { message?: string }
}

function paymentIntentId(session: StripeCheckoutSession) {
  if (!session.payment_intent) return null
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
}

export function stripePaymentIntentId(session: StripeCheckoutSession) {
  return paymentIntentId(session)
}

async function stripeRequest<T>(secret: string, method: string, path: string, params?: Record<string, string>) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
  })
  const data = (await response.json()) as T & StripeErrorBody
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe request failed (${response.status})`)
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
    'metadata[order_id]': params.orderId,
    'payment_intent_data[metadata][order_id]': params.orderId,
    'payment_intent_data[receipt_email]': params.email,
  }

  params.lineItems.forEach((item, index) => {
    body[`line_items[${index}][quantity]`] = String(item.quantity)
    body[`line_items[${index}][price_data][currency]`] = 'jpy'
    body[`line_items[${index}][price_data][unit_amount]`] = String(item.amount)
    body[`line_items[${index}][price_data][product_data][name]`] = item.name
    if (item.image?.startsWith('https://')) {
      body[`line_items[${index}][price_data][product_data][images][0]`] = item.image
    }
  })

  return stripeRequest<StripeCheckoutSession>(secret, 'POST', '/checkout/sessions', body)
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
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, ...rest] = part.split('=')
      return [key, rest.join('=')]
    }),
  )
  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  return safeEqual(hex(mac), expected)
}

export type StripeEvent = {
  type: string
  data: { object: StripeCheckoutSession }
}
