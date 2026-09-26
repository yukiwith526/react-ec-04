import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function AuthPanel({ onDone }: { onDone?: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const goLogin = () => {
    setMode('login')
    setVerifyUrl(null)
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    setNotice(null)
    setVerifyUrl(null)
    try {
      if (mode === 'login') {
        await login(email, String(form.get('password') ?? ''))
        onDone?.()
      } else {
        const result = await register({
          name: String(form.get('name') ?? ''),
          email,
          password: String(form.get('password') ?? ''),
          zip: String(form.get('zip') ?? ''),
          address: String(form.get('address') ?? ''),
        })
        setNotice(result.message)
        if (result.canLogin || result.emailTestMode) {
          setMode('login')
          setError(null)
        }
        if (result.verifyUrl) setVerifyUrl(result.verifyUrl)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '認証に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-tabs" role="tablist">
        <button type="button" className={mode === 'login' ? 'is-on' : ''} onClick={() => goLogin()}>
          ログイン
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'is-on' : ''}
          onClick={() => {
            setMode('register')
            setError(null)
          }}
        >
          新規会員登録
        </button>
      </div>
      <form className="checkout__form" onSubmit={(event) => void submit(event)}>
        {mode === 'register' && (
          <>
            <p className="muted">
              いまは Resend のテスト送信です。確認メールは実際には届きません。登録後はそのままログインへお進みください。
            </p>
            <label>
              お名前
              <input required name="name" placeholder="山田 花子" autoComplete="name" />
            </label>
          </>
        )}
        <label>
          メールアドレス
          <input
            required
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label>
          パスワード（8文字以上・英字と数字）
          <input
            required
            type="password"
            name="password"
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {mode === 'register' && (
          <>
            <label>
              郵便番号
              <input name="zip" placeholder="150-0001" autoComplete="postal-code" />
            </label>
            <label>
              住所
              <input name="address" placeholder="東京都渋谷区..." autoComplete="street-address" />
            </label>
          </>
        )}
        {notice && <p className="muted">{notice}</p>}
        {verifyUrl && (
          <p className="muted">
            確認メールの代わりに <a href={verifyUrl}>こちらからメール確認</a> できます。
          </p>
        )}
        {error && <p className="empty">{error}</p>}
        <button type="submit" className="btn btn--terracotta" disabled={busy}>
          {busy ? '送信中...' : mode === 'login' ? 'ログイン' : '会員登録する'}
        </button>
        {mode === 'register' && (
          <button type="button" className="text-btn" onClick={() => goLogin()}>
            ログインへ進む
          </button>
        )}
      </form>
    </div>
  )
}
