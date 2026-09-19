import { Link, useNavigate } from 'react-router-dom'
import { FREE_SHIPPING_THRESHOLD } from '../data/storefront'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useUi } from '../context/UiContext'
import { formatPrice } from '../lib/format'
import { IconClose } from './Icons'

export function CartDrawer() {
  const navigate = useNavigate()
  const { items, setQuantity, removeItem, addItem, subtotal, remainingForFreeShipping } = useCart()
  const { products, getById } = useCatalog()
  const { cartOpen, closeCart } = useUi()
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const inCart = new Set(items.map((item) => item.productId))
  const upsells = products.filter((product) => !inCart.has(product.id) && product.stock > 0).slice(0, 2)

  return (
    <>
      <div className={`overlay ${cartOpen ? 'is-open' : ''}`} onClick={closeCart} />
      <aside className={`drawer drawer--right ${cartOpen ? 'is-open' : ''}`} aria-hidden={!cartOpen}>
        <header className="drawer__head">
          <p>CART</p>
          <button type="button" aria-label="閉じる" onClick={closeCart}>
            <IconClose />
          </button>
        </header>

        <div className="ship-progress">
          {remainingForFreeShipping === 0 && subtotal > 0 ? (
            <p>送料無料です</p>
          ) : (
            <p>あと {formatPrice(remainingForFreeShipping)} で送料無料</p>
          )}
          <div className="ship-progress__bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>カートは空です。</p>
            <Link to="/shop" className="btn btn--teal" onClick={closeCart}>
              買い物を続ける
            </Link>
          </div>
        ) : (
          <div className="cart-lines">
            {items.map((item) => {
              const product = getById(item.productId)
              if (!product) return null
              return (
                <article key={item.key} className="cart-line">
                  <Link to={`/products/${product.slug}`} onClick={closeCart}>
                    <img src={product.images[0]} alt="" />
                  </Link>
                  <div>
                    <h3>{product.name}</h3>
                    {item.scent && <p className="muted">{item.scent}</p>}
                    <p>{formatPrice(product.price)}</p>
                    <div className="qty">
                      <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <button type="button" className="text-btn" onClick={() => removeItem(item.key)}>
                    削除
                  </button>
                </article>
              )
            })}
          </div>
        )}

        {upsells.length > 0 && items.length > 0 && (
          <div className="upsell">
            <p>BUY IT WITH</p>
            {upsells.map((product) => (
              <div key={product.id} className="upsell__row">
                <img src={product.images[0]} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--outline-sm"
                  onClick={() => addItem(product.id, { scent: product.scents?.[0] })}
                >
                  ADD TO CART
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="cart-foot">
          <div className="cart-foot__row">
            <span>小計</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="muted">送料はチェックアウト時に計算されます。</p>
          <button
            type="button"
            className="btn btn--terracotta"
            disabled={items.length === 0}
            onClick={() => {
              closeCart()
              navigate('/checkout')
            }}
          >
            CHECKOUT
          </button>
        </div>
      </aside>
    </>
  )
}
