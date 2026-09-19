import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="page">
      <p className="kicker">404</p>
      <h1>ページが見つかりません</h1>
      <Link to="/" className="btn btn--teal">
        ホームへ
      </Link>
    </section>
  )
}
