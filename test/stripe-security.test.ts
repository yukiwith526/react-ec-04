import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  classifyStripeSecret,
  decideFulfillment,
  isStripeCheckoutUrl,
  publicStripeFailure,
  StripeRequestError,
  verifyStripeWebhook,
  type StripeCheckoutSession,
} from '../worker/stripe.ts'

const encoder = new TextEncoder()

function session(overrides: Partial<StripeCheckoutSession> = {}): StripeCheckoutSession {
  return {
    id: 'cs_test_abc',
    url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
    status: 'complete',
    payment_status: 'paid',
    currency: 'jpy',
    amount_total: 1980,
    client_reference_id: 'order-1',
    payment_intent: 'pi_test_abc',
    metadata: { order_id: 'order-1' },
    ...overrides,
  }
}

async function sign(secret: string, timestamp: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  return [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

describe('sandbox secret', () => {
  it('accepts sandbox secret prefixes and rejects live or placeholder keys', () => {
    assert.equal(classifyStripeSecret(`sk_test_${'a'.repeat(20)}`), 'sandbox')
    assert.equal(classifyStripeSecret(`rk_test_${'b'.repeat(20)}`), 'sandbox')
    assert.equal(classifyStripeSecret(`rkcs_test_${'c'.repeat(20)}`), 'sandbox')
    assert.equal(classifyStripeSecret(`sk_live_${'d'.repeat(20)}`), 'live')
    assert.equal(classifyStripeSecret('sk_test_replace_me'), 'missing')
    assert.equal(classifyStripeSecret('pk_test_publishable'), 'invalid')
    assert.equal(classifyStripeSecret(undefined), 'missing')
  })

  it('does not echo key material in the customer-facing error', () => {
    const failure = publicStripeFailure(new StripeRequestError('api_key_expired'))
    assert.equal(failure.code, 'STRIPE_KEY_EXPIRED')
    assert.doesNotMatch(failure.message, /sk_|rk_|rkcs_|whsec_|63PN/)
    const live = publicStripeFailure(new StripeRequestError('live_key_refused'))
    assert.equal(live.code, 'STRIPE_LIVE_KEY')
  })
})

describe('checkout fulfillment', () => {
  const order = { id: 'order-1', total: 1980, sessionId: 'cs_test_abc' }

  it('pays only when the session is paid, complete, and matches the order', () => {
    assert.equal(decideFulfillment(session(), order), 'paid')
  })

  it('does not treat an unpaid completed session as paid', () => {
    assert.equal(decideFulfillment(session({ payment_status: 'unpaid' }), order), 'pending')
  })

  it('rejects amount, currency, and order mismatches', () => {
    assert.equal(decideFulfillment(session({ amount_total: 50 }), order), 'reject')
    assert.equal(decideFulfillment(session({ currency: 'usd' }), order), 'reject')
    assert.equal(decideFulfillment(session({ metadata: { order_id: 'other' } }), order), 'reject')
    assert.equal(decideFulfillment(session({ client_reference_id: 'other' }), order), 'reject')
    assert.equal(decideFulfillment(session({ id: 'cs_test_other' }), order), 'reject')
  })

  it('cancels expired sessions that still match the order', () => {
    assert.equal(
      decideFulfillment(session({ status: 'expired', payment_status: 'unpaid' }), order),
      'cancel',
    )
  })

  it('allows only Stripe-hosted checkout URLs', () => {
    assert.equal(isStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_abc'), true)
    assert.equal(isStripeCheckoutUrl('https://evil.example/checkout.stripe.com'), false)
    assert.equal(isStripeCheckoutUrl('http://checkout.stripe.com/c/pay/cs_test_abc'), false)
    assert.equal(isStripeCheckoutUrl(null), false)
  })
})

describe('webhook signature', () => {
  const secret = 'whsec_test_secret_value'
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' })

  it('accepts a current signature and a second v1 signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const good = await sign(secret, timestamp, payload)
    assert.equal(await verifyStripeWebhook(payload, `t=${timestamp},v1=${good}`, secret), true)
    assert.equal(
      await verifyStripeWebhook(payload, `t=${timestamp},v1=${'ab'.repeat(32)},v1=${good}`, secret),
      true,
    )
  })

  it('rejects a bad signature, a stale timestamp, and a non-webhook secret', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const good = await sign(secret, timestamp, payload)
    assert.equal(await verifyStripeWebhook(payload, `t=${timestamp},v1=${'cd'.repeat(32)}`, secret), false)
    const stale = String(Math.floor(Date.now() / 1000) - 600)
    const old = await sign(secret, stale, payload)
    assert.equal(await verifyStripeWebhook(payload, `t=${stale},v1=${old}`, secret), false)
    assert.equal(await verifyStripeWebhook(payload, `t=${timestamp},v1=${good}`, 'not-a-webhook-secret'), false)
  })
})
