import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminOrders } from '../../lib/api'
import { formatDate, formatPrice, orderStatusLabel } from '../../lib/format'
import type { AdminOrder } from '../../types'

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [])

  return (
    <section className="admin__page">
      <header className="admin__head">
        <div>
          <p className="kicker">ADMIN</p>
          <h1>注文</h1>
        </div>
      </header>
      {error && <p className="empty">{error}</p>}
      {orders.length === 0 && !error ? <p className="empty">まだ注文はありません。</p> : null}
      {orders.length > 0 && (
        <table className="admin__table">
          <thead>
            <tr>
              <th>日時</th>
              <th>顧客</th>
              <th>状態</th>
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link to={`/admin/orders/${order.id}`}>{formatDate(order.createdAt)}</Link>
                </td>
                <td>
                  <Link to={`/admin/customers/${order.customerId}`}>{order.name}</Link>
                  <div className="muted">{order.email}</div>
                </td>
                <td>
                  <span className={`admin__badge admin__badge--${order.status}`}>{orderStatusLabel(order.status)}</span>
                </td>
                <td>{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
