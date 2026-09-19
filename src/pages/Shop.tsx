import { Link, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../context/CatalogContext'
import { categories } from '../data/storefront'
import type { Category } from '../types'

export function Shop() {
  const { category } = useParams()
  const { byCategory, loading, error } = useCatalog()
  const current = categories.find((item) => item.id === category)
  const list = byCategory(current?.id as Category | undefined)

  return (
    <section className="page shop">
      <header className="page__head">
        <p className="kicker">SHOP</p>
        <h1>{current ? current.labelJa : 'すべての商品'}</h1>
        <p>メイク、スキンケア、フレグランス、ギフト。花と光のビューティー。</p>
      </header>
      <div className="shop__filters">
        <Link to="/shop" className={!current ? 'is-on' : ''}>
          ALL
        </Link>
        {categories.map((item) => (
          <Link key={item.id} to={`/shop/${item.id}`} className={item.id === current?.id ? 'is-on' : ''}>
            {item.labelJa}
          </Link>
        ))}
      </div>
      {error && <p className="empty">{error}</p>}
      {loading && <p className="empty">商品を読み込み中...</p>}
      <div className="product-grid">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
