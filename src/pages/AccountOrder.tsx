import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMyOrder } from '../lib/api'
import { formatDate, formatPrice, memberOrderStatusLabel, orderNumber } from '../lib/format'
import type { MemberOrder } from '../types'

export function AccountOrder() {
  const { id } = useParams()
  const { member, loading } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<MemberOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !member) {
      const next = id ? `/account/orders/${id}` : '/account'
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true })
    }
  }, [id, loading, member, navigate])

  useEffect(() => {
    if (!id || !member) return
    setError(null)
    setOrder(null)
    fetchMyOrder(id)
      .then(setOrder)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [id, member])

  if (loading || !member) {
    return (
      <section className="page">
        <p>読み込み中...</p>
      </section>
    )
  }

  return (
    <section className="page account">
      <header className="page__head">
        <p className="kicker">ORDER</p>
        <h1>注文詳細</h1>
      </header>
      <p className="account__back">
        <Link to="/account">マイページへ戻る</Link>
      </p>
      {error && <p className="empty">{error}</p>}
      {!error && !order && <p className="empty">読み込み中...</p>}
      {order && (
        <>
          <div className="order-card__top">
            <div>
              <p className="order-card__date">{formatDate(order.createdAt)}</p>
              <p className="order-card__no">注文番号 {orderNumber(order.id)}</p>
            </div>
            <span className={`order-status order-status--${order.status}`}>{memberOrderStatusLabel(order.status)}</span>
          </div>
          <ul className="order-lines">
            {order.items.map((item) => {
              const body = (
                <>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="order-line__ph" />}
                  <span>
                    <strong>{item.productName}</strong>
                    {item.scent ? <small>{item.scent}</small> : null}
                    <em>
                      {item.quantity}点 / {formatPrice(item.unitPrice)}
                    </em>
                  </span>
                  <b>{formatPrice(item.unitPrice * item.quantity)}</b>
                </>
              )
              return item.slug ? (
                <li key={item.id}>
                  <Link to={`/products/${item.slug}`} className="order-line">
                    {body}
                  </Link>
                </li>
              ) : (
                <li key={item.id} className="order-line">
                  {body}
                </li>
              )
            })}
          </ul>
          <dl className="order-summary">
            <div>
              <dt>小計</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt>送料</dt>
              <dd>{order.shipping === 0 ? '無料' : formatPrice(order.shipping)}</dd>
            </div>
            <div>
              <dt>合計</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <section className="account__section">
            <h2>お届け先</h2>
            <p>
              {order.name}
              <br />
              〒{order.zip}
              <br />
              {order.address}
            </p>
            {order.status === 'paid' && <p className="muted">決済確認後、原則7営業日以内に発送します。</p>}
            {order.paidAt && <p className="muted">お支払い日時 {formatDate(order.paidAt)}</p>}
          </section>
        </>
      )}
    </section>
  )
}
