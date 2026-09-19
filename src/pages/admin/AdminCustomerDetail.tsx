import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAdminCustomer } from '../../lib/api'
import { formatDate, formatPrice, orderStatusLabel } from '../../lib/format'
import type { AdminCustomer } from '../../types'

export function AdminCustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<AdminCustomer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchAdminCustomer(id)
      .then(setCustomer)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [id])

  if (error) {
    return (
      <section className="admin__page">
        <p className="empty">{error}</p>
        <Link to="/admin/customers">顧客一覧へ</Link>
      </section>
    )
  }

  if (!customer) {
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
          <p className="kicker">CUSTOMER</p>
          <h1>{customer.name}</h1>
        </div>
        <Link to="/admin/customers" className="text-btn">
          一覧へ
        </Link>
      </header>
      <dl className="admin__facts">
        <div>
          <dt>メール</dt>
          <dd>{customer.email}</dd>
        </div>
        <div>
          <dt>住所</dt>
          <dd>
            〒{customer.zip}
            <br />
            {customer.address}
          </dd>
        </div>
        <div>
          <dt>支払い合計</dt>
          <dd>{formatPrice(customer.paidTotal)}</dd>
        </div>
      </dl>
      <h2>注文</h2>
      <table className="admin__table">
        <thead>
          <tr>
            <th>日時</th>
            <th>状態</th>
            <th>合計</th>
          </tr>
        </thead>
        <tbody>
          {(customer.orders ?? []).map((order) => (
            <tr key={order.id}>
              <td>
                <Link to={`/admin/orders/${order.id}`}>{formatDate(order.createdAt)}</Link>
              </td>
              <td>{orderStatusLabel(order.status)}</td>
              <td>{formatPrice(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
