import { Link } from 'react-router-dom'
import { brand, categories } from '../data/storefront'
import { useUi } from '../context/UiContext'
import { IconClose } from './Icons'

export function NavDrawer() {
  const { navOpen, closeNav } = useUi()

  return (
    <>
      <div className={`overlay ${navOpen ? 'is-open' : ''}`} onClick={closeNav} />
      <aside className={`drawer drawer--left ${navOpen ? 'is-open' : ''}`} aria-hidden={!navOpen}>
        <header className="drawer__head">
          <p className="logo">{brand.short}</p>
          <button type="button" aria-label="閉じる" onClick={closeNav}>
            <IconClose />
          </button>
        </header>
        <nav className="nav-list">
          <Link to="/" onClick={closeNav}>
            ホーム
          </Link>
          <Link to="/shop" onClick={closeNav}>
            すべての商品
          </Link>
          {categories.map((category) => (
            <Link key={category.id} to={`/shop/${category.id}`} onClick={closeNav}>
              {category.labelJa}
            </Link>
          ))}
          <Link to="/about" onClick={closeNav}>
            ブランドについて
          </Link>
        </nav>
      </aside>
    </>
  )
}
