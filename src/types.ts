export type Category = 'makeup' | 'skincare' | 'fragrance' | 'gift'

export type Member = {
  id: string
  email: string
  name: string
  zip: string
  address: string
}

export type Product = {
  id: string
  slug: string
  name: string
  nameJa: string
  category: Category
  categoryJa: string
  price: number
  stock: number
  description: string
  details: string[]
  ingredients: string
  images: string[]
  isNew?: boolean
  scents?: string[]
  size: string
}

export type ProductImageRecord = {
  id: string
  product_id: string
  url: string
  r2_key: string | null
  sort_order: number
}

export type AdminProduct = Product & {
  isPublished: boolean
  imageRecords: ProductImageRecord[]
}

export type CartItem = {
  key: string
  productId: string
  scent?: string
  quantity: number
}

export type CategoryItem = {
  id: Category
  label: string
  labelJa: string
}

export type OrderStatus = 'pending' | 'paid' | 'canceled'

export type MemberOrderItem = {
  id: string
  productId: string
  productName: string
  slug: string | null
  imageUrl: string | null
  scent: string | null
  quantity: number
  unitPrice: number
}

export type MemberOrder = {
  id: string
  status: OrderStatus
  name: string
  email: string
  zip: string
  address: string
  subtotal: number
  shipping: number
  total: number
  createdAt: string
  paidAt: string | null
  items: MemberOrderItem[]
}

export type AdminOrderItem = {
  id: string
  productId: string
  productName: string
  scent: string | null
  quantity: number
  unitPrice: number
}

export type AdminOrder = {
  id: string
  customerId: string
  email: string
  name: string
  zip: string
  address: string
  status: OrderStatus
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  subtotal: number
  shipping: number
  total: number
  createdAt: string
  paidAt: string | null
  items: AdminOrderItem[]
}

export type AdminCustomer = {
  id: string
  email: string
  name: string
  zip: string
  address: string
  orderCount: number
  paidTotal: number
  lastOrderAt: string | null
  createdAt: string
  orders?: Omit<AdminOrder, 'items'>[]
}
