import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { heroSlides } from '../data/storefront'
import { IconChevron } from './Icons'

export function Hero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroSlides.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [])

  const go = (dir: number) => {
    setIndex((current) => (current + dir + heroSlides.length) % heroSlides.length)
  }

  return (
    <section className="hero" aria-label="メインビジュアル">
      {heroSlides.map((slide, i) => (
        <div key={slide.id} className={`hero__slide ${i === index ? 'is-active' : ''}`}>
          <img src={slide.image} alt="" />
          <div className="hero__copy">
            <p className="kicker">{slide.kicker}</p>
            <h1>{slide.title}</h1>
            <p className="hero__sub">{slide.subtitle}</p>
            <Link to={slide.href} className="btn btn--ghost-light">
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}
      <div className="hero__nav">
        <button type="button" aria-label="前のスライド" onClick={() => go(-1)}>
          <IconChevron style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="hero__dots">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className={i === index ? 'is-active' : ''}
              aria-label={`${slide.title}を表示`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button type="button" aria-label="次のスライド" onClick={() => go(1)}>
          <IconChevron />
        </button>
      </div>
    </section>
  )
}
