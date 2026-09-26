import assert from 'node:assert/strict'

const BASE = process.env.AUTH_BASE || 'https://fleur-lumiere.yukiwith526.workers.dev'

async function json(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  })
  const body = await response.json().catch(() => null)
  return { status: response.status, body, setCookie: response.headers.getSetCookie?.() || [] }
}

const email = `probe-${Date.now()}@example.com`

const weak = await json('/api/register', {
  method: 'POST',
  body: JSON.stringify({ name: 'Probe', email, password: 'short1' }),
})
assert.equal(weak.status, 400, 'weak password must be rejected')

const takenShape = await json('/api/register', {
  method: 'POST',
  body: JSON.stringify({ name: 'Probe', email, password: 'ValidPass12' }),
})
assert.equal(takenShape.body?.member, undefined, 'register must not issue a session')
assert.ok([201, 503].includes(takenShape.status), `unexpected register status ${takenShape.status}`)
if (takenShape.status === 201) {
  assert.equal(takenShape.body.pending, true)
  assert.equal(takenShape.setCookie.length, 0, 'pending register must not set auth cookie')
}

const login = await json('/api/login', {
  method: 'POST',
  body: JSON.stringify({ email, password: 'ValidPass12' }),
})
assert.equal(login.status, 401)
assert.equal(login.body?.code, 'EMAIL_NOT_FOUND')

const checkout = await json('/api/checkout/session', {
  method: 'POST',
  body: JSON.stringify({ items: [{ productId: 'x', quantity: 1 }] }),
})
assert.equal(checkout.status, 401)
assert.equal(checkout.body?.code, 'MEMBER_REQUIRED')

const redirect = await json('/api/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'not-an-email', password: 'ValidPass12' }),
})
assert.equal(redirect.status, 400)

console.log('auth security smoke passed', { registerStatus: takenShape.status })
