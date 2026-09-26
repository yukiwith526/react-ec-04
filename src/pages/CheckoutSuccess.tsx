import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { completeCheckoutSession } from '../lib/api'
import { formatPrice } from '../lib/format'

export function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { clear } = useCart()
  const { reload } = useCatalog()
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'canceled' | 'error'>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setError('決済セッションが見つかりません')
      return
    }
    completeCheckoutSession(sessionId)
      .then((data) => {
        setStatus(data.status)
        setEmail(data.email)
        setTotal(data.total)
        if (data.status === 'paid') {
          clear()
          reload()
        }
      })
      .catch((err: unknown) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : '支払いの確認に失敗しました')
      })
  }, [sessionId, clear, reload])

  return (
    <section className="page checkout checkout--done">
      <p className="kicker">CHECKOUT</p>
      {status === 'loading' && <h1>支払いを確認しています...</h1>}
      {status === 'paid' && (
        <>
          <h1>ご注文ありがとうございました</h1>
          <p>
            {email} 宛の注文を受け付けました。
            {total != null ? ` お支払い金額は ${formatPrice(total)} です。` : ''}
            ご入力のメールアドレスに注文内容をお送りします（Resend のテスト送信のため、実際には届かない場合があります）。
          </p>
        </>
      )}
      {status === 'pending' && (
        <>
          <h1>支払いを確認しています</h1>
          <p>反映まで少し時間がかかる場合があります。管理画面の注文一覧でも確認できます。</p>
        </>
      )}
      {status === 'canceled' && (
        <>
          <h1>注文はキャンセルされました</h1>
          <p>お支払いが完了していません。カートからやり直してください。</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1>確認できませんでした</h1>
          <p className="muted">{error}</p>
        </>
      )}
      <Link to="/shop" className="btn btn--teal">
        ショップへ戻る
      </Link>
    </section>
  )
}
