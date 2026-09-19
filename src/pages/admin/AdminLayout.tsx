import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { fetchAdminSession } from '../../lib/api'

export function AdminLayout() {
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminSession()
      .then((data) => setEmail(data.email))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '認証に失敗しました'))
  }, [])

  if (error) {
    return (
      <div className="admin admin--gate">
        <p className="logo">FLEUR LUMIÈRE</p>
        <h1>管理画面</h1>
        <p>本番では Cloudflare Access で保護します。この画面は公開しません。</p>
        <p className="muted">{error}</p>
        <Link to="/" className="btn btn--teal">
          ストアへ戻る
        </Link>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="admin admin--gate">
        <p>認証を確認しています...</p>
      </div>
    )
  }

  return (
    <div className="admin">
      <header className="admin__bar">
        <Link to="/admin" className="logo">
          FLEUR LUMIÈRE
        </Link>
        <nav>
          <NavLink to="/admin" end>
            商品
          </NavLink>
          <NavLink to="/admin/orders">注文</NavLink>
          <NavLink to="/admin/customers">顧客</NavLink>
          <Link to="/">ストア</Link>
        </nav>
        <span className="muted">{email}</span>
      </header>
      <Outlet />
    </div>
  )
}
