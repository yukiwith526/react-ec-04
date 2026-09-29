import type { AdminCustomer, AdminOrder, AdminProduct, Category, Member, MemberOrder, Product } from '../types'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
  })
  const data = (await response.json().catch(() => null)) as (T & { error?: string; code?: string }) | null
  if (!response.ok) {
    throw new ApiError(
      data && typeof data === 'object' && data.error ? data.error : `Request failed (${response.status})`,
      response.status,
      data && typeof data === 'object' ? data.code : undefined,
    )
  }
  return data as T
}

export function fetchMe() {
  return fetch('/api/me', { credentials: 'include' }).then(async (response) => {
    if (response.status === 401) return null
    const data = (await response.json().catch(() => null)) as { member?: Member; error?: string } | null
    if (!response.ok) {
      throw new ApiError(data?.error || `Request failed (${response.status})`, response.status)
    }
    return data?.member ?? null
  })
}

export function registerMember(payload: {
  name: string
  email: string
  password: string
  zip?: string
  address?: string
}) {
  return request<{
    pending: boolean
    message: string
    verifyUrl?: string
    emailTestMode?: boolean
    canLogin?: boolean
  }>('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function verifyMemberEmail(token: string) {
  return request<{ member: Member }>('/api/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).then((data) => data.member)
}

export function loginMember(payload: { email: string; password: string }) {
  return request<{ member: Member }>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((data) => data.member)
}

export function logoutMember() {
  return request<{ ok: boolean }>('/api/logout', { method: 'POST' })
}

export function fetchMyOrders() {
  return request<MemberOrder[]>('/api/me/orders')
}

export function fetchMyOrder(id: string) {
  return request<MemberOrder>(`/api/me/orders/${encodeURIComponent(id)}`)
}

export function updateMember(payload: { name: string; zip: string; address: string }) {
  return request<{ member: Member }>('/api/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((data) => data.member)
}

export function fetchProducts(params?: { category?: string; q?: string; isNew?: boolean }) {
  const search = new URLSearchParams()
  if (params?.category) search.set('category', params.category)
  if (params?.q) search.set('q', params.q)
  if (params?.isNew) search.set('new', '1')
  const suffix = search.size ? `?${search}` : ''
  return request<Product[]>(`/api/products${suffix}`)
}

export function fetchProduct(slug: string) {
  return request<{ product: Product; related: Product[] }>(`/api/products/${encodeURIComponent(slug)}`)
}

export function fetchCategories() {
  return request<{ id: Category; label: string; labelJa: string }[]>('/api/categories')
}

export function fetchAdminSession() {
  return request<{ email: string }>('/api/admin/session')
}

export function fetchAdminProducts() {
  return request<AdminProduct[]>('/api/admin/products')
}

export function fetchAdminProduct(id: string) {
  return request<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`)
}

export type ProductPayload = {
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

export function createAdminProduct(payload: ProductPayload) {
  return request<AdminProduct>('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateAdminProduct(id: string, payload: ProductPayload) {
  return request<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function unpublishAdminProduct(id: string) {
  return request<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function uploadAdminImage(id: string, file: File) {
  const body = new FormData()
  body.set('file', file)
  return request<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}/images`, {
    method: 'POST',
    body,
  })
}

export function deleteAdminImage(productId: string, imageId: string) {
  return request<AdminProduct>(
    `/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: 'DELETE' },
  )
}

export function createCheckoutSession(payload: {
  name: string
  email: string
  zip: string
  address: string
  items: { productId: string; scent?: string; quantity: number }[]
}) {
  return request<{ url: string; orderId: string }>('/api/checkout/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function completeCheckoutSession(sessionId: string) {
  return request<{ status: 'pending' | 'paid' | 'canceled'; orderId: string; email: string; total: number }>(
    `/api/checkout/session/${encodeURIComponent(sessionId)}`,
  )
}

export function fetchAdminCustomers() {
  return request<AdminCustomer[]>('/api/admin/customers')
}

export function fetchAdminCustomer(id: string) {
  return request<AdminCustomer>(`/api/admin/customers/${encodeURIComponent(id)}`)
}

export function fetchAdminOrders() {
  return request<AdminOrder[]>('/api/admin/orders')
}

export function fetchAdminOrder(id: string) {
  return request<AdminOrder>(`/api/admin/orders/${encodeURIComponent(id)}`)
}
