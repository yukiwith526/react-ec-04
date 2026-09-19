import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { useUi } from '../context/UiContext'
import { fetchProduct } from '../lib/api'
import { formatPrice } from '../lib/format'
import { IconHeart } from '../components/Icons'
import type { Product } from '../types'

export function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem, toggleWishlist, isWished } = useCart()
  const { openCart, notify } = useUi()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [missing, setMissing] = useState(false)
  const [scent, setScent] = useState('')
  const [qty, setQty] = useState(1)
  const [image, setImage] = useState(0)
  const [openAcc, setOpenAcc] = useState('desc')

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setMissing(false)
    fetchProduct(slug)
      .then((data) => {
        if (cancelled) return
        setProduct(data.product)
        setRelated(data.related)
        setScent(data.product.scents?.[0] ?? '')
        setQty(1)
        setImage(0)
        setOpenAcc('desc')
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null)
          setMissing(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (missing) {
    return (
      <section className="page">
        <h1>商品が見つかりません</h1>
        <Link to="/shop">ショップへ戻る</Link>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="page">
        <p>読み込み中...</p>
      </section>
    )
  }

  const soldOut = product.stock <= 0
  const add = (buyNow = false) => {
    addItem(product.id, { scent: product.scents ? scent : undefined, quantity: qty })
    notify('カートに追加しました')
    if (buyNow) {
      navigate('/checkout')
    } else {
      openCart()
    }
  }

  return (
    <section className="page product">
      <p className="crumb">
        <Link to="/">Home</Link> / <Link to={`/shop/${product.category}`}>{product.categoryJa}</Link> / {product.name}
      </p>
      <div className="product__layout">
        <div className="product__gallery">
          <div className="product__hero-img">
            {product.isNew && <span className="badge">NEW</span>}
            <img src={product.images[image] ?? product.images[0]} alt={product.nameJa} />
          </div>
          <div className="product__thumbs">
            {product.images.map((src, i) => (
              <button key={src} type="button" className={i === image ? 'is-on' : ''} onClick={() => setImage(i)}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="product__buy">
          <p className="kicker">{product.categoryJa}</p>
          <h1>{product.name}</h1>
          <p className="product__ja">{product.nameJa} ／ {product.size}</p>
          <p className="product__price">{formatPrice(product.price)}</p>
          {soldOut && <p className="muted">売り切れです</p>}

          {product.scents && (
            <div className="scent-picker">
              <p>
                SHADE <strong>{scent}</strong>
              </p>
              <div className="scent-row">
                {product.scents.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={option === scent ? 'is-on' : ''}
                    onClick={() => setScent(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qty qty--lg">
            <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
              −
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((n) => Math.min(product.stock || 1, n + 1))}>
              +
            </button>
          </div>

          <button type="button" className="btn btn--outline-peach" disabled={soldOut} onClick={() => add(false)}>
            ADD TO CART + {formatPrice(product.price * qty)}
          </button>
          <button type="button" className="btn btn--terracotta" disabled={soldOut} onClick={() => add(true)}>
            BUY IT NOW
          </button>
          <button
            type="button"
            className={`wish-inline ${isWished(product.id) ? 'is-on' : ''}`}
            onClick={() => toggleWishlist(product.id)}
          >
            <IconHeart filled={isWished(product.id)} /> お気に入りに追加
          </button>

          <div className="acc">
            {[
              ['desc', '商品説明', product.description],
              ['details', '使い方・特長', product.details.join(' / ')],
              ['ing', '成分', product.ingredients],
            ].map(([id, label, body]) => (
              <div key={id}>
                <button type="button" onClick={() => setOpenAcc(id)}>
                  {label}
                  <span>{openAcc === id ? '−' : '+'}</span>
                </button>
                {openAcc === id && <p>{body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <header className="section__head">
            <p className="kicker">YOU MAY ALSO LIKE</p>
            <h2>関連商品</h2>
          </header>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
