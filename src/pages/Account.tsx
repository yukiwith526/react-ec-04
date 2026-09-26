import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Account() {
  const { member, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !member) navigate('/login?next=/account', { replace: true })
  }, [loading, member, navigate])

  if (loading || !member) {
    return (
      <section className="page">
        <p>読み込み中...</p>
      </section>
    )
  }

  return (
    <section className="page checkout">
      <header className="page__head">
        <p className="kicker">MY PAGE</p>
        <h1>マイページ</h1>
      </header>
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
  )
}
