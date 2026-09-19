import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminCustomers } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'
import type { AdminCustomer } from '../../types'

export function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminCustomers()
      .then(setCustomers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [])

  return (
    <section className="admin__page">
      <header className="admin__head">
        <div>
          <p className="kicker">ADMIN</p>
          <h1>顧客</h1>
        </div>
      </header>
      {error && <p className="empty">{error}</p>}
      {customers.length === 0 && !error ? <p className="empty">まだ顧客はいません。</p> : null}
      {customers.length > 0 && (
        <table className="admin__table">
          <thead>
            <tr>
              <th>氏名</th>
              <th>メール</th>
              <th>注文</th>
              <th>支払い合計</th>
              <th>最終注文</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <Link to={`/admin/customers/${customer.id}`}>{customer.name}</Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.orderCount}</td>
                <td>{formatPrice(customer.paidTotal)}</td>
                <td>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
