import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthPanel } from '../components/AuthPanel'
import { useAuth } from '../context/AuthContext'
import { safeNextPath } from '../lib/safePath'

export function Login() {
  const { member, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const verified = params.get('verified') === '1'

  useEffect(() => {
    if (!loading && member) navigate(next, { replace: true })
  }, [loading, member, navigate, next])

  if (loading || member) {
    return (
      <section className="page">
        <p>読み込み中...</p>
      </section>
    )
  }

  return (
    <section className="page checkout">
      <header className="page__head">
        <p className="kicker">MEMBER</p>
        <h1>ログイン / 会員登録</h1>
        <p>
          ご購入手続きには会員登録またはログインが必要です。Resend
          はテストモードのため確認メールは届きません。登録したメールとパスワードでログインへお進みください。
        </p>
        {verified && <p className="muted">メールアドレスの確認が完了しました。ログインしてください。</p>}
      </header>
      <AuthPanel onDone={() => navigate(next)} />
    </section>
  )
}
