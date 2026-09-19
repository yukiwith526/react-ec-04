import type { Category, Product } from '../src/types'
import type { AdminProduct, Env, ImageRow, ProductInput, ProductRow } from './types'
import { jsonError } from './auth'

const CATEGORIES: Category[] = ['makeup', 'skincare', 'fragrance', 'gift']

const PRODUCT_SELECT = `
  SELECT p.*, c.label_ja
  FROM products p
  JOIN categories c ON c.id = p.category_id
`

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function toProduct(row: ProductRow, images: ImageRow[]): Product {
  const scents = parseJsonArray(row.scents_json)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameJa: row.name_ja,
    category: row.category_id,
    categoryJa: row.label_ja,
    price: row.price,
    stock: row.stock,
    description: row.description,
    details: parseJsonArray(row.details_json),
    ingredients: row.ingredients,
    images: images.map((image) => image.url),
    isNew: row.is_new === 1,
    scents: scents.length > 0 ? scents : undefined,
    size: row.size,
  }
}

function toAdminProduct(row: ProductRow, images: ImageRow[]): AdminProduct {
  return {
    ...toProduct(row, images),
    isPublished: row.is_published === 1,
    imageRecords: images,
  }
}

async function imagesFor(env: Env, productIds: string[]) {
  if (productIds.length === 0) return new Map<string, ImageRow[]>()
  const placeholders = productIds.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`,
  )
    .bind(...productIds)
    .all<ImageRow>()

  const map = new Map<string, ImageRow[]>()
  for (const image of results) {
    const list = map.get(image.product_id) ?? []
    list.push(image)
    map.set(image.product_id, list)
  }
  return map
}

export async function listCategories(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT id, label, label_ja, sort_order FROM categories ORDER BY sort_order ASC',
  ).all()
  return results.map((row) => ({
    id: row.id as Category,
    label: String(row.label),
    labelJa: String(row.label_ja),
  }))
}

export async function listProducts(env: Env, options: { publishedOnly: boolean; category?: string; query?: string; isNew?: boolean }) {
  const clauses = ['1 = 1']
  const params: (string | number)[] = []

  if (options.publishedOnly) {
    clauses.push('p.is_published = 1')
  }
  if (options.category && CATEGORIES.includes(options.category as Category)) {
    clauses.push('p.category_id = ?')
    params.push(options.category)
  }
  if (options.isNew) {
    clauses.push('p.is_new = 1')
  }
  if (options.query) {
    clauses.push('(LOWER(p.name) LIKE ? OR LOWER(p.name_ja) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(c.label_ja) LIKE ?)')
    const like = `%${options.query.toLowerCase()}%`
    params.push(like, like, like, like)
  }

  const { results } = await env.DB.prepare(
    `${PRODUCT_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY p.sort_order ASC, p.created_at ASC`,
  )
    .bind(...params)
    .all<ProductRow>()

  const imageMap = await imagesFor(env, results.map((row) => row.id))
  return results.map((row) =>
    options.publishedOnly ? toProduct(row, imageMap.get(row.id) ?? []) : toAdminProduct(row, imageMap.get(row.id) ?? []),
  )
}

export async function getProductBySlug(env: Env, slug: string, publishedOnly: boolean) {
  const row = await env.DB.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).bind(slug).first<ProductRow>()
  if (!row || (publishedOnly && row.is_published !== 1)) return null
  const imageMap = await imagesFor(env, [row.id])
  const images = imageMap.get(row.id) ?? []
  return publishedOnly ? toProduct(row, images) : toAdminProduct(row, images)
}

export async function getProductById(env: Env, id: string) {
  const row = await env.DB.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).bind(id).first<ProductRow>()
  if (!row) return null
  const imageMap = await imagesFor(env, [row.id])
  return toAdminProduct(row, imageMap.get(row.id) ?? [])
}

export async function getRelated(env: Env, product: Product) {
  const { results } = await env.DB.prepare(
    `${PRODUCT_SELECT} WHERE p.is_published = 1 AND p.category_id = ? AND p.id != ? ORDER BY p.sort_order ASC LIMIT 4`,
  )
    .bind(product.category, product.id)
    .all<ProductRow>()
  const imageMap = await imagesFor(env, results.map((row) => row.id))
  return results.map((row) => toProduct(row, imageMap.get(row.id) ?? []))
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `product-${crypto.randomUUID().slice(0, 8)}`
}

export function parseProductInput(body: unknown): ProductInput | Response {
  if (!body || typeof body !== 'object') return jsonError('Invalid JSON body', 400)
  const data = body as Record<string, unknown>

  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const nameJa = typeof data.nameJa === 'string' ? data.nameJa.trim() : ''
  const category = data.category
  const price = Number(data.price)
  const stock = Number(data.stock)

  if (!name) return jsonError('name is required', 400)
  if (!nameJa) return jsonError('nameJa is required', 400)
  if (typeof category !== 'string' || !CATEGORIES.includes(category as Category)) {
    return jsonError('category is invalid', 400)
  }
  if (!Number.isInteger(price) || price < 0) return jsonError('price must be a non-negative integer', 400)
  if (!Number.isInteger(stock) || stock < 0) return jsonError('stock must be an integer of 0 or more', 400)

  const details = Array.isArray(data.details) ? data.details.filter((item) => typeof item === 'string') : []
  const scents = Array.isArray(data.scents) ? data.scents.filter((item) => typeof item === 'string') : []

  return {
    slug: slugify(slug || name),
    name,
    nameJa,
    category: category as Category,
    price,
    stock,
    description: typeof data.description === 'string' ? data.description : '',
    ingredients: typeof data.ingredients === 'string' ? data.ingredients : '',
    size: typeof data.size === 'string' ? data.size : '',
    details,
    scents,
    isNew: Boolean(data.isNew),
    isPublished: data.isPublished !== false,
  }
}

export async function createProduct(env: Env, input: ProductInput) {
  const existing = await env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(input.slug).first()
  if (existing) return jsonError('slug already exists', 409)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const sort = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM products').first<{ next: number }>()

  await env.DB.prepare(
    `INSERT INTO products (
      id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
      details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.slug,
      input.name,
      input.nameJa,
      input.category,
      input.price,
      input.stock,
      input.description,
      input.ingredients,
      input.size,
      JSON.stringify(input.details),
      JSON.stringify(input.scents),
      input.isNew ? 1 : 0,
      input.isPublished ? 1 : 0,
      sort?.next ?? 1,
      now,
      now,
    )
    .run()

  return getProductById(env, id)
}

export async function updateProduct(env: Env, id: string, input: ProductInput) {
  const current = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first()
  if (!current) return jsonError('Product not found', 404)

  const clash = await env.DB.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').bind(input.slug, id).first()
  if (clash) return jsonError('slug already exists', 409)

  await env.DB.prepare(
    `UPDATE products SET
      slug = ?, name = ?, name_ja = ?, category_id = ?, price = ?, stock = ?,
      description = ?, ingredients = ?, size = ?, details_json = ?, scents_json = ?,
      is_new = ?, is_published = ?, updated_at = ?
    WHERE id = ?`,
  )
    .bind(
      input.slug,
      input.name,
      input.nameJa,
      input.category,
      input.price,
      input.stock,
      input.description,
      input.ingredients,
      input.size,
      JSON.stringify(input.details),
      JSON.stringify(input.scents),
      input.isNew ? 1 : 0,
      input.isPublished ? 1 : 0,
      new Date().toISOString(),
      id,
    )
    .run()

  return getProductById(env, id)
}

export async function unpublishProduct(env: Env, id: string) {
  const current = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first()
  if (!current) return jsonError('Product not found', 404)
  await env.DB.prepare('UPDATE products SET is_published = 0, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), id)
    .run()
  return getProductById(env, id)
}

export async function addProductImage(env: Env, productId: string, file: File) {
  const product = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(productId).first()
  if (!product) return jsonError('Product not found', 404)

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return jsonError('Unsupported image type', 400)

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg'
  const imageId = crypto.randomUUID()
  const key = `products/${productId}/${imageId}.${ext}`
  await env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  const sort = await env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM product_images WHERE product_id = ?',
  )
    .bind(productId)
    .first<{ next: number }>()

  await env.DB.prepare(
    'INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(imageId, productId, `/media/${key}`, key, sort?.next ?? 0)
    .run()

  return getProductById(env, productId)
}

export async function removeProductImage(env: Env, productId: string, imageId: string) {
  const image = await env.DB.prepare(
    'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
  )
    .bind(imageId, productId)
    .first<ImageRow>()
  if (!image) return jsonError('Image not found', 404)

  if (image.r2_key) {
    await env.MEDIA.delete(image.r2_key)
  }
  await env.DB.prepare('DELETE FROM product_images WHERE id = ?').bind(imageId).run()
  return getProductById(env, productId)
}
