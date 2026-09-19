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

export async function sendOrderConfirmation(env: Env, order: OrderMail) {
  if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_FROM) return false

  const from = env.ORDER_EMAIL_FROM
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [order.email],
      subject: '【FLEUR LUMIÈRE】ご注文ありがとうございます',
      html: orderHtml(order),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('order email failed', response.status, body)
    return false
  }
  return true
}
