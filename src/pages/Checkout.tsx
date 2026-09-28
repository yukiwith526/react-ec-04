import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPanel } from '../components/AuthPanel'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { SHIPPING_FEE } from '../data/storefront'
import { createCheckoutSession } from '../lib/api'
import { formatPrice } from '../lib/format'

export function Checkout() {
  const { member, loading: authLoading } = useAuth()
  const { items, subtotal, remainingForFreeShipping, setQuantity, removeItem } = useCart()
  const { getById } = useCatalog()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const shipping = remainingForFreeShipping === 0 && subtotal > 0 ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!member) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const { url } = await createCheckoutSession({
        name: String(form.get('name') ?? ''),
        email: member.email,
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
        <div>
          {authLoading && <p>読み込み中...</p>}
          {!authLoading && !member && (
            <>
              <h2>会員登録 / ログイン</h2>
              <p className="muted">お支払いの前に、会員登録またはログインをしてください。確認メールは Resend テストのため届きません。登録後はログインへ進んでください。</p>
              <AuthPanel />
            </>
          )}
          {member && (
            <form className="checkout__form" onSubmit={(event) => void submit(event)}>
              <p className="muted">
                {member.name} 様（{member.email}）でログイン中です。{' '}
                <Link to="/account">マイページ</Link>
              </p>
              <h2>お届け先</h2>
              <label>
                お名前
                <input required name="name" defaultValue={member.name} autoComplete="name" />
              </label>
              <label>
                郵便番号
                <input required name="zip" defaultValue={member.zip} placeholder="150-0001" autoComplete="postal-code" />
              </label>
              <label>
                住所
                <input
                  required
                  name="address"
                  defaultValue={member.address}
                  placeholder="東京都渋谷区..."
                  autoComplete="street-address"
                />
              </label>
              <h2>お支払い</h2>
              <p className="muted">Stripe のサンドボックス決済ページへ移動します。カード番号は 4242 4242 4242 4242、有効期限は未来の日付、CVC は任意の3桁です。</p>
              {error && <p className="empty">{error}</p>}
              <button type="submit" className="btn btn--terracotta" disabled={busy}>
                {busy ? '接続中...' : `${formatPrice(total)} を支払う`}
              </button>
              <p className="checkout__brief">
                お支払いはクレジットカードです。決済が完了したときに課金されます。
                <br />
                商品は、決済確認後、原則2〜7営業日以内に発送します。
                <br />
                返品は、未開封・未使用の商品に限り、到着後7日以内にご連絡ください。お客様都合の返送料はお客様負担となります。不良品や誤配送の場合は、当店負担で交換または返金いたします。
              </p>
              <p className="checkout__brief">
                詳細は
                <Link to="/shipping">配送・返品について</Link>
                、
                <Link to="/tokushoho">特定商取引法に基づく表記</Link>
                、
                <Link to="/privacy">プライバシーポリシー</Link>
                をご覧ください。
              </p>
            </form>
          )}
        </div>
        <aside className="checkout__summary">
          <h2>注文内容</h2>
          {items.map((item) => {
            const product = getById(item.productId)
            if (!product) return null
            return (
              <article key={item.key} className="mini-line mini-line--edit">
                <img src={product.images[0]} alt="" />
                <div>
                  <p>
                    {product.name}
                    {item.scent ? ` / ${item.scent}` : ''}
                  </p>
                  <div className="qty qty--sm">
                    <button type="button" aria-label="数量を減らす" onClick={() => setQuantity(item.key, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label="数量を増やす" onClick={() => setQuantity(item.key, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button type="button" className="text-btn" onClick={() => removeItem(item.key)}>
                    削除
                  </button>
                </div>
                <strong>{formatPrice(product.price * item.quantity)}</strong>
              </article>
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
