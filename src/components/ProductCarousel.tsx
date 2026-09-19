import { useRef } from 'react'
import type { Product } from '../types'
import { IconChevron } from './Icons'
import { ProductCard } from './ProductCard'

export function ProductCarousel({
  title,
  subtitle,
  products,
}: {
  title: string
  subtitle: string
  products: Product[]
}) {
  const scroller = useRef<HTMLDivElement>(null)

  const scrollByCard = (dir: number) => {
    const node = scroller.current
    if (!node) return
    const card = node.querySelector('article')
    const amount = card ? card.getBoundingClientRect().width + 24 : 280
    node.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <section className="section arrivals">
      <header className="section__head">
        <p className="kicker">{title}</p>
        <h2>{subtitle}</h2>
      </header>
      <div className="carousel">
        <button type="button" className="carousel__arrow is-prev" aria-label="前へ" onClick={() => scrollByCard(-1)}>
          <IconChevron style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="carousel__track" ref={scroller}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <button type="button" className="carousel__arrow is-next" aria-label="次へ" onClick={() => scrollByCard(1)}>
          <IconChevron />
        </button>
      </div>
    </section>
  )
}
