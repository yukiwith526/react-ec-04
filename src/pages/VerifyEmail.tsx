import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function VerifyEmail() {
  const { member, loading, verifyEmail } = useAuth()
  const navigate = useNavigate()
  const { token: pathToken } = useParams()
  const [params] = useSearchParams()
  const token = (pathToken || params.get('token') || '').replace(/\s+/g, '')
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (loading) return
    if (member) {
      navigate('/account', { replace: true })
      return
    }
    if (!token) {
      setError('確認リンクが無効です')
      return
    }
    if (started.current) return
    started.current = true
    verifyEmail(token).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : '確認に失敗しました')
    })
  }, [loading, member, navigate, token, verifyEmail])

  return (
    <section className="page checkout">
      <header className="page__head">
        <p className="kicker">MEMBER</p>
        <h1>メールアドレスの確認</h1>
      </header>
      {error ? (
        <>
          <p className="empty">{error}</p>
          <Link to="/login">ログイン / 会員登録へ</Link>
        </>
      ) : (
        <p>確認しています...</p>
      )}
    </section>
  )
}
