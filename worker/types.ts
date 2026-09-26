import type { Category, Product } from '../src/types'

export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
  ASSETS?: Fetcher
  ENVIRONMENT?: string
  CF_ACCESS_TEAM_DOMAIN?: string
  CF_ACCESS_AUD?: string
  MEMBER_JWT_SECRET?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  RESEND_API_KEY?: string
  ORDER_EMAIL_FROM?: string
  EMAIL?: {
    send(message: {
      to: string
      from: string
      subject: string
      html?: string
      text?: string
    }): Promise<{ messageId?: string }>
  }
}

export type AccessIdentity = {
  email: string
}

export type CategoryRow = {
  id: Category
  label: string
  label_ja: string
  sort_order: number
}

export type ProductRow = {
  id: string
  slug: string
  name: string
  name_ja: string
  category_id: Category
  label_ja: string
  price: number
  stock: number
  description: string
  ingredients: string
  size: string
  details_json: string
  scents_json: string
  is_new: number
  is_published: number
  sort_order: number
}

export type ImageRow = {
  id: string
  product_id: string
  url: string
  r2_key: string | null
  sort_order: number
}

export type AdminProduct = Product & {
  isPublished: boolean
  imageRecords: ImageRow[]
}

export type ProductInput = {
  slug: string
  name: string
  nameJa: string
  category: Category
  price: number
  stock: number
  description: string
  ingredients: string
  size: string
  details: string[]
  scents: string[]
  isNew: boolean
  isPublished: boolean
}
