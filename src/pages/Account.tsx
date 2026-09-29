import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMyOrders } from '../lib/api'
import { formatDate, formatPrice, memberOrderStatusLabel, orderNumber } from '../lib/format'
import type { MemberOrder } from '../types'

export function Account() {
  const { member, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<MemberOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !member) navigate('/login?next=/account', { replace: true })
  }, [loading, member, navigate])

  useEffect(() => {
    if (!member) return
    fetchMyOrders()
      .then(setOrders)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '注文履歴を読み込めませんでした'))
  }, [member])

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
        <p className="kicker">MY PAGE</p>
        <h1>マイページ</h1>
      </header>

      <section className="account__section">
        <h2>会員情報</h2>
        <dl className="admin__facts">
          <div>
            <dt>お名前</dt>
            <dd>{member.name}</dd>
          </div>
          <div>
            <dt>メール</dt>
            <dd>{member.email}</dd>
          </div>
          <div>
            <dt>お届け先</dt>
            <dd>
              {member.zip ? `〒${member.zip}` : '未登録'}
              <br />
              {member.address || '住所は購入時に入力できます'}
            </dd>
          </div>
        </dl>
        <div className="auth-actions">
          <Link to="/shop" className="btn btn--teal">
            買い物を続ける
          </Link>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              void logout().then(() => navigate('/'))
            }}
          >
            ログアウト
          </button>
        </div>
      </section>

      <section className="account__section">
        <h2>ご注文履歴</h2>
        {error && <p className="empty">{error}</p>}
        {orders && orders.length === 0 && (
          <p className="empty">
            まだご注文はありません。
            <Link to="/shop"> 商品を見る</Link>
          </p>
        )}
        {!error && !orders && <p className="empty">読み込み中...</p>}
        <div className="order-list">
          {orders?.map((order) => {
            const preview = order.items.slice(0, 3)
            const rest = order.items.length - preview.length
            return (
              <Link key={order.id} to={`/account/orders/${order.id}`} className="order-card">
                <div className="order-card__top">
                  <div>
                    <p className="order-card__date">{formatDate(order.createdAt)}</p>
                    <p className="order-card__no">注文番号 {orderNumber(order.id)}</p>
                  </div>
                  <span className={`order-status order-status--${order.status}`}>
                    {memberOrderStatusLabel(order.status)}
                  </span>
                </div>
                <ul className="order-lines">
                  {preview.map((item) => (
                    <li key={item.id} className="order-line">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="order-line__ph" />}
                      <span>
                        <strong>{item.productName}</strong>
                        {item.scent ? <small>{item.scent}</small> : null}
                        <em>
                          {item.quantity}点 / {formatPrice(item.unitPrice)}
                        </em>
                      </span>
                    </li>
                  ))}
                </ul>
                {rest > 0 && <p className="order-card__more">ほか{rest}点</p>}
                <p className="order-card__total">
                  合計 {formatPrice(order.total)}
                  <span>詳細を見る</span>
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </section>
  )
}
