import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAdminOrder } from '../../lib/api'
import { formatDate, formatPrice, orderStatusLabel } from '../../lib/format'
import type { AdminOrder } from '../../types'

export function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchAdminOrder(id)
      .then(setOrder)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [id])

  if (error) {
    return (
      <section className="admin__page">
        <p className="empty">{error}</p>
        <Link to="/admin/orders">注文一覧へ</Link>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="admin__page">
        <p>読み込み中...</p>
      </section>
    )
  }

  return (
    <section className="admin__page">
      <header className="admin__head">
        <div>
          <p className="kicker">ORDER</p>
          <h1>{orderStatusLabel(order.status)}</h1>
        </div>
        <Link to="/admin/orders" className="text-btn">
          一覧へ
        </Link>
      </header>
      <dl className="admin__facts">
        <div>
          <dt>注文日時</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        {order.paidAt && (
          <div>
            <dt>支払い日時</dt>
            <dd>{formatDate(order.paidAt)}</dd>
          </div>
        )}
        <div>
          <dt>顧客</dt>
          <dd>
            <Link to={`/admin/customers/${order.customerId}`}>{order.name}</Link>
            <div className="muted">{order.email}</div>
          </dd>
        </div>
        <div>
          <dt>お届け先</dt>
          <dd>
            〒{order.zip}
            <br />
            {order.address}
          </dd>
        </div>
      </dl>
      <table className="admin__table">
        <thead>
          <tr>
            <th>商品</th>
            <th>数量</th>
            <th>単価</th>
            <th>小計</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.productName}
                {item.scent ? ` / ${item.scent}` : ''}
              </td>
              <td>{item.quantity}</td>
              <td>{formatPrice(item.unitPrice)}</td>
              <td>{formatPrice(item.unitPrice * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="admin__totals">
        小計 {formatPrice(order.subtotal)} ／ 送料 {order.shipping === 0 ? '無料' : formatPrice(order.shipping)}
        <strong>合計 {formatPrice(order.total)}</strong>
      </p>
    </section>
  )
}
