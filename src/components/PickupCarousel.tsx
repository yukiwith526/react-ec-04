import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { pickupStories } from '../data/storefront'
import { IconChevron } from './Icons'

export function PickupCarousel() {
  const scroller = useRef<HTMLDivElement>(null)

  const scrollByCard = (dir: number) => {
    const node = scroller.current
    if (!node) return
    const amount = node.clientWidth
    const max = node.scrollWidth - node.clientWidth
    const next = node.scrollLeft + dir * amount
    if (next > max - 8) {
      node.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (next < 0) {
      node.scrollTo({ left: max, behavior: 'smooth' })
      return
    }
    node.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const node = scroller.current
    let paused = false
    const pause = () => {
      paused = true
    }
    const resume = () => {
      paused = false
    }
    node?.addEventListener('pointerdown', pause)
    node?.addEventListener('pointerleave', resume)
    const id = window.setInterval(() => {
      if (!paused) scrollByCard(1)
    }, 4200)
    return () => {
      window.clearInterval(id)
      node?.removeEventListener('pointerdown', pause)
      node?.removeEventListener('pointerleave', resume)
    }
  }, [])

  return (
    <section className="section pickup">
      <header className="section__head">
        <p className="kicker">PICK UP</p>
        <h2>ピックアップ</h2>
      </header>
      <div className="carousel">
        <button type="button" className="carousel__arrow is-prev" aria-label="前へ" onClick={() => scrollByCard(-1)}>
          <IconChevron style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="carousel__track pickup__track" ref={scroller}>
          {pickupStories.map((story) => (
            <Link key={story.id} to={story.href} className="pickup-card">
              <img src={story.image} alt="" />
              <div>
                <p className="kicker">{story.kicker}</p>
                <h3>{story.title}</h3>
                <p>{story.text}</p>
              </div>
            </Link>
          ))}
        </div>
        <button type="button" className="carousel__arrow is-next" aria-label="次へ" onClick={() => scrollByCard(1)}>
          <IconChevron />
        </button>
      </div>
    </section>
  )
}
