import { brand, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from './storefront'

export const legal = {
  brand: brand.name,
  seller: '株式会社フルールルミエール（仮）',
  representative: '（仮）',
  address: '〒107-0062 東京都港区南青山1-2-3 デモビル3F',
  phone: '03-0000-0000（平日 10:00–17:00）',
  email: brand.email,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  paymentMethod: 'クレジットカード（Stripe）のみ',
  paymentTiming: 'ご注文の確定時（カード決済の完了時）に課金します。',
  dispatchTiming:
    '決済確認後、原則7営業日以内に発送します。在庫切れや天候・交通事情により遅れる場合は、メールでご連絡します。',
}

export const returns = {
  eligible:
    '未開封・未使用の商品に限ります。コスメは衛生上、開封済み・使用済み、お客様都合の汚れ・破損はお受けできません。ご注文前に、商品名、カラー、香り、数量をご確認ください。',
  defective:
    '不良品、誤配送、配送中の破損は、開封後でも当店負担で良品と交換、または返金します。',
  contactDeadline: `商品の到着日を起算日として7日以内に ${legal.email} へメールでご連絡ください。`,
  shipDeadline: '当店からの返品案内後、7日以内に指定の住所へ商品を返送してください。',
  returnShipping:
    'お客様都合の返品は、返送料をお客様負担とします。不良品・誤配送・配送中破損の返送料は当店負担です。',
  refund:
    '返金は、お支払いいただいたクレジットカードへ行います。返送商品の到着と状態確認後、原則7営業日以内に Stripe 経由で手続きします。カード会社の反映まで数日かかることがあります。',
  coolingOff: '通信販売のため、クーリング・オフの適用はありません。',
}
