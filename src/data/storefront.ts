import type { Category } from '../types'

export const brand = {
  name: 'FLEUR LUMIÈRE',
  short: 'FLEUR LUMIÈRE',
  email: 'hello@fleur-lumiere.example',
}

export const categories: { id: Category; label: string; labelJa: string }[] = [
  { id: 'makeup', label: 'Makeup', labelJa: 'メイク' },
  { id: 'skincare', label: 'Skincare', labelJa: 'スキンケア' },
  { id: 'fragrance', label: 'Fragrance', labelJa: 'フレグランス' },
  { id: 'gift', label: 'Gift', labelJa: 'ギフトセット' },
]

export const heroSlides = [
  {
    id: 'bloom',
    kicker: 'LIMITED EDITION',
    title: 'Petit Romance Bouquet',
    subtitle: '花びらの光を、指先に。春の限定コフレ。',
    cta: '詳しく見る',
    href: '/products/petal-holiday-coffret',
    image: '/brand/hero.png',
  },
  {
    id: 'lip',
    kicker: 'NEW COLOR',
    title: 'Crystal Bloom Lip',
    subtitle: '透けるようなピンクが、笑顔に残る。',
    cta: 'リップを見る',
    href: '/products/crystal-bloom-lip-oil',
    image: '/products/lip-oil.png',
  },
  {
    id: 'scent',
    kicker: 'SIGNATURE SCENT',
    title: 'Moon Petal Eau',
    subtitle: '夜の花がほころぶ、やさしい香り。',
    cta: 'フレグランスを見る',
    href: '/shop/fragrance',
    image: '/products/perfume.png',
  },
]

export const pickupStories = [
  {
    id: 'palette',
    kicker: 'PICK UP',
    title: 'ムーンライト アイパレット',
    text: '夜明けの空を閉じ込めた、9色の花びら。',
    href: '/products/moonlight-eye-palette',
    image: '/products/palette.png',
  },
  {
    id: 'mist',
    kicker: 'CARE',
    title: 'ローズデュー ミスト',
    text: 'メイクの上から、朝露のようにひと吹き。',
    href: '/products/rose-dew-mist',
    image: '/products/mist.png',
  },
  {
    id: 'lip',
    kicker: 'NEW',
    title: 'クリスタルブルーム リップオイル',
    text: '透けるピンクが、微笑むたびに残る。',
    href: '/products/crystal-bloom-lip-oil',
    image: '/products/lip-oil.png',
  },
  {
    id: 'primer',
    kicker: 'BASE',
    title: 'シルクヴェール プライマー',
    text: 'ラベンダーの光で、毛穴をやわらげる下地。',
    href: '/products/silk-veil-primer',
    image: '/products/primer-lilac.png',
  },
  {
    id: 'perfume',
    kicker: 'SCENT',
    title: 'ムーンペタル オードトワレ',
    text: '夜にほころぶ花の、やさしい残り香。',
    href: '/products/moon-petal-eau',
    image: '/products/perfume.png',
  },
  {
    id: 'gift',
    kicker: 'LIMITED',
    title: 'ペタル ホリデーコフレ',
    text: '花束のようにまとめた、贈り物のセット。',
    href: '/products/petal-holiday-coffret',
    image: '/products/gift-set.png',
  },
]

export const newsItems = [
  {
    date: '2026.09.18',
    title: 'Petit Romance Bouquet 限定コフレを発売しました',
    href: '/products/petal-holiday-coffret',
  },
  {
    date: '2026.09.01',
    title: '公式オンラインショップをリニューアルオープン',
    href: '/shop',
  },
  {
    date: '2026.08.12',
    title: '秋の新色 クリスタルブルーム リップオイル 3色追加',
    href: '/products/crystal-bloom-lip-oil',
  },
]

export const instagramPosts = [
  '/products/primer-lilac.png',
  '/products/primer-ivory.png',
  '/products/lip-oil.png',
  '/products/perfume.png',
  '/products/gift-set.png',
  '/brand/rose.png',
]

export const FREE_SHIPPING_THRESHOLD = 8000
export const SHIPPING_FEE = 550
