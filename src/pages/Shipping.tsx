import { Link } from 'react-router-dom'
import { legal, returns } from '../data/legal'
import { formatPrice } from '../lib/format'

export function Shipping() {
  return (
    <section className="page legal">
      <header className="page__head">
        <p className="kicker">SHIPPING & RETURNS</p>
        <h1>配送・返品について</h1>
        <p>お届けと、万一のときのご案内です。</p>
      </header>

      <h2>配送について</h2>
      <p>日本国内のみお届けします。海外への発送は行っておりません。</p>
      <p>
        配送業者は当店指定となります。決済確認後、原則2〜7営業日以内に発送し、発送完了後に追跡番号をメールでお知らせします。
      </p>
      <p>{legal.dispatchTiming}</p>

      <h2>送料</h2>
      <p>
        送料は全国一律 {formatPrice(legal.shippingFee)}（税込）です。{formatPrice(legal.freeShippingThreshold)}{' '}
        以上のご購入で送料無料です。商品代金以外の料金は送料のみです。
      </p>

      <h2>ご注文前のご確認</h2>
      <p>
        コスメは香りや色の感じ方がお一人さまごとに異なります。ご注文前に、商品名、カラー、香り、数量をお確かめください。
      </p>
      <p>{returns.coolingOff}</p>

      <h2>返品できる条件</h2>
      <p>{returns.eligible}</p>
      <p>{returns.defective}</p>

      <h2>連絡・返送の期限</h2>
      <p>{returns.contactDeadline}</p>
      <p>{returns.shipDeadline}</p>
      <p>{returns.returnShipping}</p>

      <h2>返金方法</h2>
      <p>{returns.refund}</p>

      <p className="legal__note">
        販売条件の詳細は
        <Link to="/tokushoho">特定商取引法に基づく表記</Link>
        をご覧ください。
      </p>
    </section>
  )
}
