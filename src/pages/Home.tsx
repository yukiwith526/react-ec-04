import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandConcept } from '../components/BrandConcept'
import { Hero } from '../components/Hero'
import { PickupCarousel } from '../components/PickupCarousel'
import { ProductCarousel } from '../components/ProductCarousel'
import { useCatalog } from '../context/CatalogContext'
import { categories, instagramPosts, newsItems } from '../data/storefront'
import type { Category } from '../types'

export function Home() {
  const { products, newArrivals, loading, error, byCategory } = useCatalog()
  const arrivals = newArrivals()
  const gifts = byCategory('gift')
  const fragrances = byCategory('fragrance')
  const [featured, setFeatured] = useState<Category | 'all'>('all')
  const featuredList = featured === 'all' ? products.slice(0, 8) : byCategory(featured).slice(0, 8)

  return (
    <>
      <Hero />
      <BrandConcept />
      {error && <p className="page empty">{error}</p>}
      {loading && arrivals.length === 0 && <p className="page empty">商品を読み込み中...</p>}

      <PickupCarousel />

      <ProductCarousel title="GIFT SET" subtitle="ギフトセット" products={gifts.length ? gifts : arrivals} />
      <div className="center-cta">
        <Link to="/shop/gift" className="btn btn--teal">
          ギフトを見る
        </Link>
      </div>

      <ProductCarousel title="FRAGRANCE" subtitle="フレグランス" products={fragrances} />
      <div className="center-cta">
        <Link to="/shop/fragrance" className="btn btn--teal">
          もっと見る
        </Link>
      </div>

      <section className="section featured">
        <header className="section__head">
          <p className="kicker">FEATURED ITEMS</p>
          <h2>おすすめアイテム</h2>
        </header>
        <div className="shop__filters">
          <button type="button" className={featured === 'all' ? 'is-on' : ''} onClick={() => setFeatured('all')}>
            ALL
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={featured === item.id ? 'is-on' : ''}
              onClick={() => setFeatured(item.id)}
            >
              {item.labelJa}
            </button>
          ))}
        </div>
        <div className="product-grid product-grid--home">
          {featuredList.map((product) => (
            <Link key={product.id} to={`/products/${product.slug}`} className="mini-product">
              <img src={product.images[0]} alt={product.nameJa} />
              <h3>{product.nameJa}</h3>
              <p>¥{product.price.toLocaleString('ja-JP')}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section instagram">
        <header className="instagram__intro">
          <p className="kicker">INSTAGRAM</p>
          <h2>@fleurlumiere</h2>
          <p>花と光の毎日を、そっとお届けします。</p>
          <a
            className="instagram__follow"
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
          >
            フォローする
          </a>
        </header>
        <div className="instagram__grid">
          {instagramPosts.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
      </section>

      <section className="section news">
        <header className="section__head">
          <p className="kicker">NEWS</p>
          <h2>お知らせ</h2>
        </header>
        <ul className="news__list">
          {newsItems.map((item) => (
            <li key={item.title}>
              <Link to={item.href}>
                <time>{item.date}</time>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
