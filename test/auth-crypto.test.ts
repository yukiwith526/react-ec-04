import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { safeNextPath } from '../src/lib/safePath.ts'
import {
  isStrongPassword,
  isValidEmail,
  sha256Hex,
  timingSafeEqual,
  decideRateLimit,
  rateLimitUserMessage,
} from '../worker/auth-crypto.ts'

describe('auth-crypto', () => {
  it('rejects weak passwords', () => {
    assert.equal(isStrongPassword('short1A'), false)
    assert.equal(isStrongPassword('alllettersxx'), false)
    assert.equal(isStrongPassword('12345678'), false)
    assert.equal(isStrongPassword('Pass1234'), true)
  })

  it('validates email shape', () => {
    assert.equal(isValidEmail('a@b.c'), true)
    assert.equal(isValidEmail('not-an-email'), false)
  })

  it('compares secrets in constant-length fashion', () => {
    assert.equal(timingSafeEqual('abc', 'abc'), true)
    assert.equal(timingSafeEqual('abc', 'abd'), false)
    assert.equal(timingSafeEqual('abc', 'ab'), false)
  })

  it('blocks open redirects in next=', () => {
    assert.equal(safeNextPath('/checkout'), '/checkout')
    assert.equal(safeNextPath('https://evil.example'), '/account')
    assert.equal(safeNextPath('//evil.example'), '/account')
  })

  it('hashes tokens so the raw value is not stored', async () => {
    const a = await sha256Hex('token-a')
    const b = await sha256Hex('token-b')
    assert.equal(a.length, 64)
    assert.notEqual(a, b)
  })
})

describe('rate limit', () => {
  it('starts a window on first hit', () => {
    const now = 1_000_000
    const next = decideRateLimit(null, now, 5, 60_000)
    assert.equal(next.action, 'reset')
    if (next.action === 'reset') {
      assert.equal(next.count, 1)
      assert.equal(next.reset_at, now + 60_000)
    }
  })

  it('increments until the limit then blocks', () => {
    const now = 1_000_000
    const windowMs = 3_600_000
    let row = { count: 1, reset_at: now + windowMs }
    for (let i = 2; i <= 5; i += 1) {
      const next = decideRateLimit(row, now, 5, windowMs)
      assert.equal(next.action, 'hit')
      if (next.action === 'hit') {
        assert.equal(next.count, i)
        row = { count: next.count, reset_at: next.reset_at }
      }
    }
    const blocked = decideRateLimit(row, now, 5, windowMs)
    assert.equal(blocked.action, 'block')
    if (blocked.action === 'block') {
      assert.equal(blocked.retryAfterSec, 3600)
      assert.match(rateLimitUserMessage('register', blocked.retryAfterSec), /約60分後/)
    }
  })

  it('resets after the window elapses', () => {
    const now = 2_000_000
    const next = decideRateLimit({ count: 99, reset_at: now - 1 }, now, 5, 60_000)
    assert.equal(next.action, 'reset')
  })

  it('login window is 15 minutes at 10 attempts', () => {
    const now = 0
    const blocked = decideRateLimit({ count: 10, reset_at: 15 * 60 * 1000 }, now, 10, 15 * 60 * 1000)
    assert.equal(blocked.action, 'block')
    if (blocked.action === 'block') {
      assert.equal(blocked.retryAfterSec, 900)
      assert.match(rateLimitUserMessage('login', blocked.retryAfterSec), /ログイン/)
    }
  })
})
