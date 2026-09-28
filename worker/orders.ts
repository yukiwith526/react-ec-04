import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../src/data/storefront'
import { jsonError } from './auth'
import { enforceRateLimit, getMember } from './members'
import { sendOrderConfirmation } from './email'
import {
  classifyStripeSecret,
  createStripeCheckoutSession,
  decideFulfillment,
  publicStripeFailure,
  retrieveStripeCheckoutSession,
  StripeRequestError,
  stripePaymentIntentId,
  verifyStripeWebhook,
  type StripeCheckoutSession,
  type StripeEvent,
} from './stripe'
import type { Env } from './types'

type ProductStock = {
  id: string
  name: string
  price: number
  stock: number
  is_published: number
  scents_json: string
}

type OrderRow = {
  id: string
  customer_id: string
  email: string
  name: string
  zip: string
  address: string
  status: 'pending' | 'paid' | 'canceled'
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  subtotal: number
  shipping: number
  total: number
  stock_held: number
  created_at: string
  paid_at: string | null
  email_sent_at: string | null
}

type ItemRow = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  scent: string | null
  quantity: number
  unit_price: number
}

type CustomerRow = {
  id: string
  email: string
  name: string
  zip: string
  address: string
  created_at: string
  updated_at: string
  order_count: number
  paid_total: number
  last_order_at: string | null
}

type CartLine = {
  productId: string
  scent?: string
  quantity: number
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}

function mapOrder(row: OrderRow, items: ItemRow[] = []) {
  return {
    id: row.id,
    customerId: row.customer_id,
    email: row.email,
    name: row.name,
    zip: row.zip,
    address: row.address,
    status: row.status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    emailSentAt: row.email_sent_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      scent: item.scent,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  }
}

function mapCustomer(row: CustomerRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    zip: row.zip,
    address: row.address,
    orderCount: row.order_count,
    paidTotal: row.paid_total,
    lastOrderAt: row.last_order_at,
    createdAt: row.created_at,
  }
}

const CUSTOMER_SELECT = `
  SELECT
    c.*,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total ELSE 0 END), 0) AS paid_total,
    MAX(o.created_at) AS last_order_at
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
`

async function itemsFor(env: Env, orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, ItemRow[]>()
  const placeholders = orderIds.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY product_name ASC`,
  )
    .bind(...orderIds)
    .all<ItemRow>()
  const map = new Map<string, ItemRow[]>()
  for (const item of results) {
    const list = map.get(item.order_id) ?? []
    list.push(item)
    map.set(item.order_id, list)
  }
  return map
}

async function getOrder(env: Env, id: string) {
  const row = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>()
  if (!row) return null
  const items = await itemsFor(env, [id])
  return mapOrder(row, items.get(id) ?? [])
}

function stripeNotReady(secret: string | undefined) {
  const kind = classifyStripeSecret(secret)
  if (kind === 'sandbox') return null
  const code = kind === 'live' ? 'live_key_refused' : kind === 'missing' ? 'missing_key' : 'invalid_key'
  const failure = publicStripeFailure(new StripeRequestError(code))
  return jsonError(failure.message, failure.status, failure.code)
}

function stripeFailed(error: unknown) {
  const failure = publicStripeFailure(error)
  console.error(JSON.stringify({ level: 'error', event: 'checkout', code: failure.code }))
  return jsonError(failure.message, failure.status, failure.code)
}

async function adjustStock(env: Env, orderId: string, direction: 1 | -1) {
  const now = new Date().toISOString()
  const { results } = await env.DB.prepare(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
  )
    .bind(orderId)
    .all<{ product_id: string; quantity: number }>()
  for (const item of results) {
    const quantity = item.quantity * direction
    if (direction < 0) {
      await env.DB.prepare(
        'UPDATE products SET stock = MAX(stock + ?, 0), updated_at = ? WHERE id = ?',
      )
        .bind(quantity, now, item.product_id)
        .run()
    } else {
      await env.DB.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
        .bind(quantity, now, item.product_id)
        .run()
    }
  }
}

async function returnHeldStock(env: Env, needed: Map<string, number>) {
  const now = new Date().toISOString()
  for (const [productId, quantity] of needed) {
    await env.DB.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
      .bind(quantity, now, productId)
      .run()
  }
}

async function holdStock(env: Env, needed: Map<string, number>) {
  const now = new Date().toISOString()
  const held: { productId: string; quantity: number }[] = []
  for (const [productId, quantity] of needed) {
    const updated = await env.DB.prepare(
      'UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND is_published = 1 AND stock >= ?',
    )
      .bind(quantity, now, productId, quantity)
      .run()
    if (updated.meta.changes !== 1) {
      for (const item of held) {
        await env.DB.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
          .bind(item.quantity, now, item.productId)
          .run()
      }
      return false
    }
    held.push({ productId, quantity })
  }
  return true
}

async function fulfillPaidOrder(env: Env, orderId: string, paymentIntentId: string | null) {
  const existing = await env.DB.prepare('SELECT status, stock_held FROM orders WHERE id = ?')
    .bind(orderId)
    .first<{ status: string; stock_held: number }>()
  if (!existing) return null
  if (existing.status === 'paid') return getOrder(env, orderId)

  const now = new Date().toISOString()
  const updated = await env.DB.prepare(
    `UPDATE orders
     SET status = 'paid', stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id), paid_at = ?
     WHERE id = ? AND status = 'pending'`,
  )
    .bind(paymentIntentId, now, orderId)
    .run()

  if (updated.meta.changes === 0) return getOrder(env, orderId)
  if (existing.stock_held !== 1) await adjustStock(env, orderId, -1)
  return getOrder(env, orderId)
}

async function sendPaidOrderEmail(
  env: Env,
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>,
) {
  if (order.status !== 'paid') return
  const row = await env.DB.prepare('SELECT email_sent_at FROM orders WHERE id = ?')
    .bind(order.id)
    .first<{ email_sent_at: string | null }>()
  if (row?.email_sent_at) return

  try {
    const sent = await sendOrderConfirmation(env, order)
    if (!sent.ok) return
    await env.DB.prepare(
      `UPDATE orders SET email_sent_at = ? WHERE id = ? AND email_sent_at IS NULL`,
    )
      .bind(new Date().toISOString(), order.id)
      .run()
  } catch (error) {
    console.error('order email failed', error)
  }
}

async function cancelPendingOrder(env: Env, orderId: string) {
  const released = await env.DB.prepare(
    `UPDATE orders SET status = 'canceled', stock_held = 0 WHERE id = ? AND status = 'pending' AND stock_held = 1`,
  )
    .bind(orderId)
    .run()
  if (released.meta.changes === 1) {
    await adjustStock(env, orderId, 1)
    return getOrder(env, orderId)
  }
  await env.DB.prepare(`UPDATE orders SET status = 'canceled' WHERE id = ? AND status = 'pending'`)
    .bind(orderId)
    .run()
  return getOrder(env, orderId)
}

async function releaseStaleHolds(env: Env) {
  const cutoff = new Date(Date.now() - 35 * 60 * 1000).toISOString()
  const { results } = await env.DB.prepare(
    `SELECT id FROM orders WHERE status = 'pending' AND stock_held = 1 AND created_at < ? ORDER BY created_at ASC LIMIT 50`,
  )
    .bind(cutoff)
    .all<{ id: string }>()
  for (const row of results) await cancelPendingOrder(env, row.id)
}

async function applyStripeSession(env: Env, session: StripeCheckoutSession) {
  const orderId =
    session.metadata?.order_id ||
    session.client_reference_id ||
    (
      await env.DB.prepare('SELECT id FROM orders WHERE stripe_checkout_session_id = ?')
        .bind(session.id)
        .first<{ id: string }>()
    )?.id

  if (!orderId) return { order: null, rejected: true }
  const existing = await getOrder(env, orderId)
  if (!existing) return { order: null, rejected: false }

  const decision = decideFulfillment(session, {
    id: existing.id,
    total: existing.total,
    sessionId: existing.stripeCheckoutSessionId,
  })
  if (decision === 'reject') return { order: existing, rejected: true }
  if (decision === 'paid') {
    const order = await fulfillPaidOrder(env, orderId, stripePaymentIntentId(session))
    if (order) await sendPaidOrderEmail(env, order)
    return { order, rejected: false }
  }
  if (decision === 'cancel') return { order: await cancelPendingOrder(env, orderId), rejected: false }
  return { order: existing, rejected: false }
}

function parseCart(body: unknown): { customer: { name: string; email: string; zip: string; address: string }; items: CartLine[] } | Response {
  if (!body || typeof body !== 'object') return jsonError('Invalid JSON body', 400)
  const data = body as Record<string, unknown>
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const zip = typeof data.zip === 'string' ? data.zip.trim() : ''
  const address = typeof data.address === 'string' ? data.address.trim() : ''

  if (!name || name.length > 80) return jsonError('name is required', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return jsonError('email is invalid', 400)
  if (!zip || zip.length > 16) return jsonError('zip is required', 400)
  if (!address || address.length > 200) return jsonError('address is required', 400)
  if (!Array.isArray(data.items) || data.items.length === 0) return jsonError('items are required', 400)
  if (data.items.length > 20) return jsonError('too many items', 400)

  const items: CartLine[] = []
  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') return jsonError('item is invalid', 400)
    const item = raw as Record<string, unknown>
    const productId = typeof item.productId === 'string' ? item.productId : ''
    const quantity = Number(item.quantity)
    const scent = typeof item.scent === 'string' && item.scent.trim() ? item.scent.trim() : undefined
    if (!productId) return jsonError('productId is required', 400)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return jsonError('quantity must be between 1 and 20', 400)
    }
    items.push({ productId, quantity, scent })
  }

  return { customer: { name, email, zip, address }, items }
}

export async function createCheckoutSession(request: Request, env: Env) {
  const member = await getMember(request, env)
  if (!member) return jsonError('ログインが必要です', 401, 'MEMBER_REQUIRED')

  const notReady = stripeNotReady(env.STRIPE_SECRET_KEY)
  if (notReady) return notReady

  const limited = await enforceRateLimit(env, `checkout:${member.id}`, 8, 10 * 60 * 1000, 'checkout')
  if (limited) return limited

  const parsed = parseCart(await request.json().catch(() => null))
  if (parsed instanceof Response) return parsed

  const grouped = new Map<string, CartLine>()
  for (const item of parsed.items) {
    const key = `${item.productId}::${item.scent ?? ''}`
    const current = grouped.get(key)
    if (current) current.quantity += item.quantity
    else grouped.set(key, { ...item })
  }
  const lines = [...grouped.values()]

  await releaseStaleHolds(env)

  const productIds = [...new Set(lines.map((item) => item.productId))]
  const placeholders = productIds.map(() => '?').join(', ')
  const { results: products } = await env.DB.prepare(
    `SELECT id, name, price, stock, is_published, scents_json FROM products WHERE id IN (${placeholders})`,
  )
    .bind(...productIds)
    .all<ProductStock>()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const needed = new Map<string, number>()
  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product || product.is_published !== 1) return jsonError('Product is unavailable', 400)
    const scents = parseJsonArray(product.scents_json)
    if (line.scent && !scents.includes(line.scent)) return jsonError('scent is invalid', 400)
    needed.set(line.productId, (needed.get(line.productId) ?? 0) + line.quantity)
  }
  for (const [productId, quantity] of needed) {
    const product = productMap.get(productId)
    if (!product || product.stock < quantity) return jsonError('Insufficient stock', 409, 'OUT_OF_STOCK')
  }

  const subtotal = lines.reduce((sum, line) => sum + (productMap.get(line.productId)?.price ?? 0) * line.quantity, 0)
  const shipping = shippingFor(subtotal)
  const total = subtotal + shipping
  if (total < 50) return jsonError('Order total is too small', 400)

  if (!(await holdStock(env, needed))) return jsonError('Insufficient stock', 409, 'OUT_OF_STOCK')

  const now = new Date().toISOString()
  const name = parsed.customer.name || member.name
  const zip = parsed.customer.zip || member.zip
  const address = parsed.customer.address || member.address
  const orderId = crypto.randomUUID()
  try {
    await env.DB.prepare(
      `UPDATE customers SET name = ?, zip = ?, address = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(name, zip, address, now, member.id)
      .run()

    await env.DB.prepare(
      `INSERT INTO orders (
        id, customer_id, email, name, zip, address, status,
        subtotal, shipping, total, currency, stock_held, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'jpy', 1, ?)`,
    )
      .bind(
        orderId,
        member.id,
        member.email,
        name,
        zip,
        address,
        subtotal,
        shipping,
        total,
        now,
      )
      .run()

    for (const line of lines) {
      const product = productMap.get(line.productId)!
      await env.DB.prepare(
        `INSERT INTO order_items (id, order_id, product_id, product_name, scent, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(crypto.randomUUID(), orderId, product.id, product.name, line.scent ?? null, line.quantity, product.price)
        .run()
    }

    const origin = new URL(request.url).origin
    const stripeLines = lines.map((line) => {
      const product = productMap.get(line.productId)!
      return {
        name: line.scent ? `${product.name} / ${line.scent}` : product.name,
        amount: product.price,
        quantity: line.quantity,
      }
    })
    if (shipping > 0) {
      stripeLines.push({ name: '送料', amount: shipping, quantity: 1 })
    }

    const session = await createStripeCheckoutSession(env.STRIPE_SECRET_KEY!, {
      orderId,
      email: member.email,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout`,
      lineItems: stripeLines,
    })
    await env.DB.prepare('UPDATE orders SET stripe_checkout_session_id = ? WHERE id = ?')
      .bind(session.id, orderId)
      .run()
    return Response.json({ url: session.url, orderId })
  } catch (error) {
    await returnHeldStock(env, needed)
    await env.DB.prepare('DELETE FROM order_items WHERE order_id = ?').bind(orderId).run()
    await env.DB.prepare(`DELETE FROM orders WHERE id = ? AND status = 'pending'`).bind(orderId).run()
    return stripeFailed(error)
  }
}

export async function completeCheckoutSession(request: Request, env: Env, sessionId: string) {
  const member = await getMember(request, env)
  if (!member) return jsonError('ログインが必要です', 401, 'MEMBER_REQUIRED')

  const notReady = stripeNotReady(env.STRIPE_SECRET_KEY)
  if (notReady) return notReady
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId) || sessionId.length > 255) {
    return jsonError('Invalid session', 400)
  }

  const owner = await env.DB.prepare(
    'SELECT customer_id FROM orders WHERE stripe_checkout_session_id = ?',
  )
    .bind(sessionId)
    .first<{ customer_id: string }>()
  if (!owner || owner.customer_id !== member.id) return jsonError('Order not found', 404)

  try {
    const session = await retrieveStripeCheckoutSession(env.STRIPE_SECRET_KEY!, sessionId)
    const result = await applyStripeSession(env, session)
    if (result.rejected) return jsonError('支払い内容を確認できませんでした', 409, 'STRIPE_MISMATCH')
    if (!result.order || result.order.customerId !== member.id) return jsonError('Order not found', 404)
    return Response.json({
      status: result.order.status,
      orderId: result.order.id,
      email: result.order.email,
      total: result.order.total,
    })
  } catch (error) {
    return stripeFailed(error)
  }
}

export async function handleStripeWebhook(request: Request, env: Env) {
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
  if (!secret.startsWith('whsec_')) {
    return jsonError('Stripe webhook is not configured', 501, 'STRIPE_WEBHOOK_NOT_CONFIGURED')
  }
  const payload = await request.text()
  if (payload.length > 200_000) return jsonError('Invalid webhook payload', 400)
  const signature = request.headers.get('stripe-signature') ?? ''
  const valid = await verifyStripeWebhook(payload, signature, secret)
  if (!valid) return jsonError('Invalid Stripe signature', 400)

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return jsonError('Invalid webhook payload', 400)
  }
  if (!event?.data?.object || typeof event.type !== 'string') {
    return jsonError('Invalid webhook payload', 400)
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded' ||
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    if (event.type === 'checkout.session.async_payment_failed') {
      event.data.object.status = 'expired'
      event.data.object.payment_status = 'unpaid'
    }
    const result = await applyStripeSession(env, event.data.object)
    if (result.rejected) {
      console.error(JSON.stringify({ level: 'error', event: 'stripe_webhook', code: 'STRIPE_MISMATCH', type: event.type }))
    }
  }

  return Response.json({ received: true })
}

export async function listAdminCustomers(env: Env) {
  const { results } = await env.DB.prepare(`${CUSTOMER_SELECT} GROUP BY c.id ORDER BY c.updated_at DESC`).all<CustomerRow>()
  return results.map(mapCustomer)
}

export async function getAdminCustomer(env: Env, id: string) {
  const row = await env.DB.prepare(`${CUSTOMER_SELECT} WHERE c.id = ? GROUP BY c.id`).bind(id).first<CustomerRow>()
  if (!row) return null
  const { results } = await env.DB.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
    .bind(id)
    .all<OrderRow>()
  return { ...mapCustomer(row), orders: results.map((order) => mapOrder(order)) }
}

export async function listAdminOrders(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all<OrderRow>()
  return results.map((row) => mapOrder(row))
}

export async function getAdminOrder(env: Env, id: string) {
  return getOrder(env, id)
}
