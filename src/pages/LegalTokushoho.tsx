import { legal } from '../data/legal'
import { formatPrice } from '../lib/format'

export function LegalTokushoho() {
  return (
    <section className="page legal">
      <header className="page__head">
        <p className="kicker">LEGAL</p>
        <h1>特定商取引法に基づく表記</h1>
        <p>通信販売についての広告に基づき、以下を明示します。</p>
      </header>
      <dl className="legal__dl">
        <dt>販売業者</dt>
        <dd>{legal.seller}</dd>
        <dt>運営統括責任者</dt>
        <dd>{legal.representative}</dd>
        <dt>所在地</dt>
        <dd>{legal.address}</dd>
        <dt>電話番号</dt>
        <dd>{legal.phone}</dd>
        <dt>メールアドレス</dt>
        <dd>
          <a href={`mailto:${legal.email}`}>{legal.email}</a>
        </dd>
        <dt>販売価格</dt>
        <dd>各商品ページに税込で表示します。</dd>
        <dt>送料</dt>
        <dd>
          全国一律 {formatPrice(legal.shippingFee)}（税込）。{formatPrice(legal.freeShippingThreshold)} 以上で送料無料。
        </dd>
        <dt>商品代金以外の必要料金</dt>
        <dd>送料のみです。代引きは取り扱っておりません。</dd>
        <dt>支払方法</dt>
        <dd>クレジットカード。決済完了時に課金します。</dd>
        <dt>引渡時期</dt>
        <dd>決済確認後、原則2〜7営業日以内に発送します。</dd>
        <dt>返品・交換</dt>
        <dd>
          未開封・未使用品は到着後7日以内にご連絡ください。お客様都合の返送料はお客様負担です。不良品・誤配送・配送中の破損は当店負担で交換または返金します。返金はご利用のクレジットカードへ行います。通信販売のため、クーリング・オフの適用はありません。
        </dd>
        <dt>販売条件</dt>
        <dd>日本国内への配送に限ります。ご注文前に、商品名、カラー、香り、数量をご確認ください。</dd>
      </dl>
    </section>
  )
}
