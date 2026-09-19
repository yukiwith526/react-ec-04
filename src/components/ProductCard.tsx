import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUi } from '../context/UiContext'
import { formatPrice } from '../lib/format'
import type { Product } from '../types'
import { IconHeart } from './Icons'

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isWished, addItem } = useCart()
  const { closeSearch, openCart, notify } = useUi()
  const wished = isWished(product.id)
  const soldOut = product.stock <= 0

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={`/products/${product.slug}`} onClick={closeSearch}>
          {product.isNew && <span className="badge">NEW</span>}
          <img src={product.images[0]} alt={product.nameJa} />
        </Link>
        <button
          type="button"
          className={`wish-btn ${wished ? 'is-on' : ''}`}
          aria-label="お気に入り"
          onClick={() => toggleWishlist(product.id)}
        >
          <IconHeart filled={wished} />
        </button>
      </div>
      <Link to={`/products/${product.slug}`} className="product-card__info" onClick={closeSearch}>
        <p className="product-card__brand">フルール リュミエール</p>
        <h3>{product.nameJa}</h3>
        <span>
          {formatPrice(product.price)}
          <small>（税込）</small>
        </span>
      </Link>
      <button
        type="button"
        className="btn btn--cart"
        disabled={soldOut}
        onClick={() => {
          addItem(product.id, { scent: product.scents?.[0] })
          notify('カートに追加しました')
          openCart()
        }}
      >
        {soldOut ? '売り切れ' : 'カートに入れる'}
      </button>
    </article>
  )
}
