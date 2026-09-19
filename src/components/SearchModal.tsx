import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { useUi } from '../context/UiContext'
import { IconClose, IconSearch } from './Icons'
import { ProductCard } from './ProductCard'

export function SearchModal() {
  const { searchOpen, closeSearch } = useUi()
  const { search } = useCatalog()
  const [query, setQuery] = useState('')
  const results = useMemo(() => search(query), [query, search])

  if (!searchOpen) return null

  return (
    <div className="search-modal" role="dialog" aria-modal="true" aria-label="商品検索">
      <button type="button" className="search-modal__backdrop" onClick={closeSearch} aria-label="閉じる" />
      <div className="search-modal__panel">
        <div className="search-modal__bar">
          <IconSearch />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="商品名・カテゴリで検索"
          />
          <button type="button" aria-label="閉じる" onClick={closeSearch}>
            <IconClose />
          </button>
        </div>
        {query && results.length === 0 && <p className="empty">該当する商品がありません。</p>}
        <div className="search-modal__grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {!query && (
          <p className="search-modal__hint">
            例：<Link to="/shop/makeup">メイク</Link> / リップ / コフレ
          </p>
        )}
      </div>
    </div>
  )
}
