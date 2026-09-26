import { formatPrice } from '../src/lib/format'
import type { Env } from './types'

type OrderMail = {
  id: string
  email: string
  name: string
  zip: string
  address: string
  subtotal: number
  shipping: number
  total: number
  items: { productName: string; scent: string | null; quantity: number; unitPrice: number }[]
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;'
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '"') return '&quot;'
    return '&#39;'
  })
}

function orderHtml(order: OrderMail) {
  const lines = order.items
    .map((item) => {
      const name = escapeHtml(item.scent ? `${item.productName} / ${item.scent}` : item.productName)
      return `<tr><td style="padding:8px 0">${name} × ${item.quantity}</td><td style="text-align:right">${formatPrice(item.unitPrice * item.quantity)}</td></tr>`
    })
    .join('')

  return `<div style="font-family:Georgia,serif;color:#222;max-width:560px">
    <p>FLEUR LUMIÈRE</p>
    <h1 style="font-size:22px">ご注文ありがとうございます</h1>
    <p>${escapeHtml(order.name)} 様の注文を受け付けました。</p>
    <table style="width:100%;border-collapse:collapse">${lines}</table>
    <p>小計 ${formatPrice(order.subtotal)} ／ 送料 ${order.shipping === 0 ? '無料' : formatPrice(order.shipping)}</p>
    <p><strong>合計 ${formatPrice(order.total)}</strong></p>
    <p>お届け先<br>〒${escapeHtml(order.zip)}<br>${escapeHtml(order.address)}</p>
    <p style="color:#888;font-size:13px">このメールは送信専用です。</p>
  </div>`
}

function isPlaceholderFrom(from: string) {
  return from.includes('resend.dev') || from.includes('workers.dev') || from.includes('example.com')
}

function fromAddress(env: Env) {
  return env.ORDER_EMAIL_FROM?.trim() || ''
}

let cachedVerifiedFrom: string | null | undefined

async function verifiedResendFrom(env: Env) {
  if (cachedVerifiedFrom !== undefined) return cachedVerifiedFrom
  if (!env.RESEND_API_KEY) {
    cachedVerifiedFrom = null
    return null
  }
  const response = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
  })
  if (!response.ok) {
    console.error('resend domains failed', response.status, await response.text())
    cachedVerifiedFrom = null
    return null
  }
  const payload = (await response.json()) as {
    data?: { name?: string; status?: string }[]
  }
  const domain =
    payload.data?.find((item) => item.name === 'mail.fleurlumiere.jp' && item.status === 'verified')?.name ||
    payload.data?.find((item) => item.status === 'verified' && item.name)?.name
  console.log(
    'resend domains',
    (payload.data ?? []).map((item) => `${item.name}:${item.status}`).join(',') || '(none)',
  )
  cachedVerifiedFrom = domain ? `FLEUR LUMIERE <noreply@${domain}>` : null
  console.log('resend from', cachedVerifiedFrom || 'onboarding@resend.dev (test mode)')
  return cachedVerifiedFrom
}

async function resolveResendFrom(env: Env) {
  const configured = fromAddress(env)
  if (configured && !isPlaceholderFrom(configured)) return configured
  return (await verifiedResendFrom(env)) || 'FLEUR LUMIERE <onboarding@resend.dev>'
}

export async function isResendTestMode(env: Env) {
  if (!env.RESEND_API_KEY) return true
  return isPlaceholderFrom(await resolveResendFrom(env))
}

async function sendViaCloudflare(env: Env, to: string, subject: string, html: string) {
  if (!env.EMAIL) return false
  const from = fromAddress(env)
  if (!from || isPlaceholderFrom(from)) return false
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  await env.EMAIL.send({ to, from, subject, html, text })
  return true
}

async function sendResend(env: Env, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) return { ok: false as const, error: 'missing-key' }
  const from = await resolveResendFrom(env)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })
  if (!response.ok) {
    const body = await response.text()
    console.error('email failed', subject, response.status, from, body)
    return { ok: false as const, error: body }
  }
  return { ok: true as const }
}

export async function sendMail(env: Env, to: string, subject: string, html: string) {
  try {
    if (await sendViaCloudflare(env, to, subject, html)) return { ok: true as const }
  } catch (error) {
    console.error('cloudflare email failed', error instanceof Error ? error.message : error)
  }
  try {
    return await sendResend(env, to, subject, html)
  } catch (error) {
    console.error('resend email failed', error instanceof Error ? error.message : error)
    return { ok: false as const, error: error instanceof Error ? error.message : 'send-failed' }
  }
}

export async function sendMemberVerification(env: Env, to: string, name: string, verifyUrl: string) {
  const html = `<div style="font-family:Georgia,serif;color:#222;max-width:560px">
    <p>FLEUR LUMIÈRE</p>
    <h1 style="font-size:22px">メールアドレスの確認</h1>
    <p>${escapeHtml(name)} 様</p>
    <p>会員登録を完了するには、次のボタンを24時間以内にタップしてください。</p>
    <p><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;padding:12px 20px;background:#d48aa6;color:#fff;text-decoration:none;border-radius:4px">メールアドレスを確認する</a></p>
    <p style="color:#888;font-size:13px">このメールに心当たりがない場合は破棄してください。リンクを開くまで会員登録は完了しません。</p>
  </div>`
  return sendMail(env, to, '【FLEUR LUMIÈRE】メールアドレスの確認', html)
}

export async function sendAlreadyMemberEmail(env: Env, to: string, name: string) {
  const html = `<div style="font-family:Georgia,serif;color:#222;max-width:560px">
    <p>FLEUR LUMIÈRE</p>
    <h1 style="font-size:22px">すでに会員登録済みです</h1>
    <p>${escapeHtml(name)} 様</p>
    <p>このメールアドレスはすでに会員登録されています。ログインしてお進みください。</p>
    <p style="color:#888;font-size:13px">このメールに心当たりがない場合は破棄してください。パスワードは変更されていません。</p>
  </div>`
  return sendMail(env, to, '【FLEUR LUMIÈRE】会員登録のご案内', html)
}

export async function sendOrderConfirmation(env: Env, order: OrderMail) {
  return sendMail(env, order.email, '【FLEUR LUMIÈRE】ご注文ありがとうございます', orderHtml(order))
}
