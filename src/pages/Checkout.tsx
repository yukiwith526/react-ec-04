import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { SHIPPING_FEE } from '../data/storefront'
import { createCheckoutSession } from '../lib/api'
import { formatPrice } from '../lib/format'

export function Checkout() {
  const { items, subtotal, remainingForFreeShipping } = useCart()
  const { getById } = useCatalog()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const shipping = remainingForFreeShipping === 0 && subtotal > 0 ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const { url } = await createCheckoutSession({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        zip: String(form.get('zip') ?? ''),
        address: String(form.get('address') ?? ''),
        items: items.map((item) => ({
          productId: item.productId,
          scent: item.scent,
          quantity: item.quantity,
        })),
      })
      window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました')
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="page">
        <h1>カートが空です</h1>
        <button type="button" className="btn btn--teal" onClick={() => navigate('/shop')}>
          買い物を続ける
        </button>
      </section>
    )
  }

  return (
    <section className="page checkout">
      <header className="page__head">
        <p className="kicker">CHECKOUT</p>
        <h1>ご購入手続き</h1>
      </header>
      <div className="checkout__layout">
        <form className="checkout__form" onSubmit={(event) => void submit(event)}>
          <h2>お客様情報</h2>
          <label>
            お名前
            <input required name="name" placeholder="山田 花子" autoComplete="name" />
          </label>
          <label>
            メールアドレス
            <input required type="email" name="email" placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            郵便番号
            <input required name="zip" placeholder="150-0001" autoComplete="postal-code" />
          </label>
          <label>
            住所
            <input required name="address" placeholder="東京都渋谷区..." autoComplete="street-address" />
          </label>
          <h2>お支払い</h2>
          <p className="muted">Stripe のテスト決済ページへ移動します。カード番号は ACCT-000015 を使えます。</p>
          {error && <p className="empty">{error}</p>}
          <button type="submit" className="btn btn--terracotta" disabled={busy}>
            {busy ? '接続中...' : `${formatPrice(total)} を支払う`}
          </button>
        </form>
        <aside className="checkout__summary">
          <h2>注文内容</h2>
          {items.map((item) => {
            const product = getById(item.productId)
            if (!product) return null
            return (
              <div key={item.key} className="mini-line">
                <img src={product.images[0]} alt="" />
                <span>
                  {product.name}
                  {item.scent ? ` / ${item.scent}` : ''} × {item.quantity}
                </span>
                <strong>{formatPrice(product.price * item.quantity)}</strong>
              </div>
            )
          })}
          <p>
            小計 {formatPrice(subtotal)} ／ 送料 {shipping === 0 ? '無料' : formatPrice(shipping)}
          </p>
          <p className="checkout__total">合計 {formatPrice(total)}</p>
        </aside>
      </div>
    </section>
  )
}
