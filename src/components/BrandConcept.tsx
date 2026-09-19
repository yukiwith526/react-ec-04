import { brand } from '../data/storefront'

export function BrandConcept() {
  return (
    <section className="concept" aria-labelledby="concept-heading">
      <p className="concept__kicker">BRAND CONCEPT</p>
      <h2 id="concept-heading" className="concept__headline">
        <span>“かわいい”に恋するすべてのひとに。</span>
      </h2>
      <div className="concept__body">
        <div className="concept__copy">
          <p className="concept__lead">“かわいい”。</p>
          <p>
            それは、見た目だけの美しさでも、
            <br className="concept__break" />
            誰かに褒められるための飾りでもなく、
            <br className="concept__break" />
            あなたを、あまくて、やわらかな
            <br className="concept__break" />
            幸福の予感でつつむもの。
          </p>
          <p className="concept__duo">INNOCENT &amp; RADIANT</p>
          <p>
            2つの魅力が惹きよせる
            <br className="concept__break" />
            幸せの魔法を、今日もあなたに。
          </p>
          <p className="concept__sign">{brand.name} Beauty.</p>
        </div>
        <img src="/brand/rose.png" alt="淡いピンクのバラ" />
      </div>
    </section>
  )
}
