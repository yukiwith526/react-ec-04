import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminProducts, unpublishAdminProduct } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { AdminProduct } from '../../types'
import { useCatalog } from '../../context/CatalogContext'

export function AdminProducts() {
  const { reload } = useCatalog()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    fetchAdminProducts()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }

  useEffect(load, [])

  const hide = async (product: AdminProduct) => {
    if (!confirm(`${product.name} を非公開にしますか？`)) return
    await unpublishAdminProduct(product.id)
    load()
    reload()
  }

  return (
    <section className="admin__page">
      <header className="admin__head">
        <div>
          <p className="kicker">ADMIN</p>
          <h1>商品管理</h1>
        </div>
        <Link to="/admin/products/new" className="btn btn--teal">
          商品を追加
        </Link>
      </header>
      {error && <p className="empty">{error}</p>}
      <table className="admin__table">
        <thead>
          <tr>
            <th>商品</th>
            <th>カテゴリ</th>
            <th>価格</th>
            <th>在庫</th>
            <th>公開</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="admin__product">
                  {product.images[0] && <img src={product.images[0]} alt="" />}
                  <div>
                    <strong>{product.name}</strong>
                    <span className="muted">{product.slug}</span>
                  </div>
                </div>
              </td>
              <td>{product.categoryJa}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.stock}</td>
              <td>{product.isPublished ? '公開' : '非公開'}</td>
              <td className="admin__actions">
                <Link to={`/admin/products/${product.id}`}>編集</Link>
                {product.isPublished && (
                  <button type="button" className="text-btn" onClick={() => void hide(product)}>
                    非公開
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
