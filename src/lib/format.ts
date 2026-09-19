export function formatPrice(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
}

export function orderStatusLabel(status: 'pending' | 'paid' | 'canceled') {
  if (status === 'paid') return '支払い済み'
  if (status === 'canceled') return 'キャンセル'
  return '未決済'
}

export function itemKey(productId: string, scent?: string) {
  return scent ? `${productId}__${scent}` : productId
}
