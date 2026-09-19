import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/storefront'
import { useCart } from '../context/CartContext'
import { useUi } from '../context/UiContext'
import { IconBag, IconClose, IconMenu, IconSearch, IconUser } from './Icons'

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  return (
    <div className="announce">
      <p>8,000円以上のご購入で全国送料無料 ／ 限定コフレ好評発売中</p>
      <button type="button" aria-label="閉じる" onClick={() => setHidden(true)}>
        <IconClose />
      </button>
    </div>
  )
}

export function Header() {
  const { itemCount } = useCart()
  const { openCart, openNav, openSearch } = useUi()

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__left">
          <button type="button" aria-label="メニュー" onClick={openNav}>
            <IconMenu />
          </button>
          <button type="button" aria-label="検索" onClick={openSearch}>
            <IconSearch />
          </button>
        </div>
        <Link to="/" className="logo">
          FLEUR LUMIÈRE
        </Link>
        <div className="header__right">
          <Link to="/about" aria-label="ブランド">
            <IconUser />
          </Link>
          <button type="button" className="bag-btn" aria-label="カート" onClick={openCart}>
            <IconBag />
            {itemCount > 0 && <span>{itemCount}</span>}
          </button>
        </div>
      </div>
      <nav className="header__nav" aria-label="カテゴリ">
        {categories.map((category) => (
          <Link key={category.id} to={`/shop/${category.id}`}>
            {category.labelJa}
          </Link>
        ))}
        <Link to="/about">ブランド</Link>
      </nav>
    </header>
  )
}
