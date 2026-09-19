import { Link } from 'react-router-dom'
import { brand, categories } from '../data/storefront'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <p className="logo">{brand.name}</p>
          <p className="footer__lead">
            花びらの光を、日常のメイクに。
            <br />
            ロマンティックな色彩と香りを、そっと届けます。
          </p>
        </div>
        <div>
          <h3>Shop</h3>
          {categories.map((category) => (
            <Link key={category.id} to={`/shop/${category.id}`}>
              {category.labelJa}
            </Link>
          ))}
        </div>
        <div>
          <h3>Info</h3>
          <Link to="/about">ブランドストーリー</Link>
          <Link to="/shop">配送・返品について</Link>
          <a href={`mailto:${brand.email}`}>お問い合わせ</a>
        </div>
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} {brand.name} All rights reserved.</p>
    </footer>
  )
}
