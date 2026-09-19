import { jsonError, requireAdmin } from './auth'
import {
  addProductImage,
  createProduct,
  getProductById,
  getProductBySlug,
  getRelated,
  listCategories,
  listProducts,
  parseProductInput,
  removeProductImage,
  unpublishProduct,
  updateProduct,
} from './catalog'
import {
  completeCheckoutSession,
  createCheckoutSession,
  getAdminCustomer,
  getAdminOrder,
  handleStripeWebhook,
  listAdminCustomers,
  listAdminOrders,
} from './orders'
import type { Env } from './types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS })
}

async function readJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const { pathname } = url

    if (request.method === 'OPTIONS' && (pathname.startsWith('/api/') || pathname.startsWith('/media/'))) {
      return new Response(null, {
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Jwt-Assertion',
        },
      })
    }

    if (pathname.startsWith('/media/')) {
      const key = decodeURIComponent(pathname.slice('/media/'.length))
      const object = await env.MEDIA.get(key)
      if (!object) return jsonError('Not found', 404)
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(object.body, { headers })
    }

    if (pathname === '/api/categories' && request.method === 'GET') {
      return json(await listCategories(env))
    }

    if (pathname === '/api/products' && request.method === 'GET') {
      const products = await listProducts(env, {
        publishedOnly: true,
        category: url.searchParams.get('category') ?? undefined,
        query: url.searchParams.get('q') ?? undefined,
        isNew: url.searchParams.get('new') === '1',
      })
      return json(products)
    }

    const publicProduct = pathname.match(/^\/api\/products\/([^/]+)$/)
    if (publicProduct && request.method === 'GET') {
      const product = await getProductBySlug(env, decodeURIComponent(publicProduct[1]), true)
      if (!product) return jsonError('Product not found', 404)
      const related = await getRelated(env, product)
      return json({ product, related })
    }

    if (pathname === '/api/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env)
    }

    if (pathname === '/api/checkout/session' && request.method === 'POST') {
      return createCheckoutSession(request, env)
    }

    const checkoutSession = pathname.match(/^\/api\/checkout\/session\/([^/]+)$/)
    if (checkoutSession && request.method === 'GET') {
      return completeCheckoutSession(env, decodeURIComponent(checkoutSession[1]))
    }

    if (pathname.startsWith('/api/admin/')) {
      const auth = await requireAdmin(request, env, ctx)
      if (auth instanceof Response) return auth

      if (pathname === '/api/admin/session' && request.method === 'GET') {
        return json({ email: auth.email })
      }

      if (pathname === '/api/admin/customers' && request.method === 'GET') {
        return json(await listAdminCustomers(env))
      }

      const adminCustomer = pathname.match(/^\/api\/admin\/customers\/([^/]+)$/)
      if (adminCustomer && request.method === 'GET') {
        const customer = await getAdminCustomer(env, decodeURIComponent(adminCustomer[1]))
        if (!customer) return jsonError('Customer not found', 404)
        return json(customer)
      }

      if (pathname === '/api/admin/orders' && request.method === 'GET') {
        return json(await listAdminOrders(env))
      }

      const adminOrder = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/)
      if (adminOrder && request.method === 'GET') {
        const order = await getAdminOrder(env, decodeURIComponent(adminOrder[1]))
        if (!order) return jsonError('Order not found', 404)
        return json(order)
      }

      if (pathname === '/api/admin/products' && request.method === 'GET') {
        return json(await listProducts(env, { publishedOnly: false }))
      }

      if (pathname === '/api/admin/products' && request.method === 'POST') {
        const input = parseProductInput(await readJson(request))
        if (input instanceof Response) return input
        const created = await createProduct(env, input)
        if (created instanceof Response) return created
        return json(created, 201)
      }

      const adminOne = pathname.match(/^\/api\/admin\/products\/([^/]+)$/)
      if (adminOne) {
        const id = decodeURIComponent(adminOne[1])
        if (request.method === 'GET') {
          const product = await getProductById(env, id)
          if (!product) return jsonError('Product not found', 404)
          return json(product)
        }
        if (request.method === 'PUT') {
          const input = parseProductInput(await readJson(request))
          if (input instanceof Response) return input
          const updated = await updateProduct(env, id, input)
          if (updated instanceof Response) return updated
          return json(updated)
        }
        if (request.method === 'DELETE') {
          const unpublished = await unpublishProduct(env, id)
          if (unpublished instanceof Response) return unpublished
          return json(unpublished)
        }
      }

      const adminImages = pathname.match(/^\/api\/admin\/products\/([^/]+)\/images$/)
      if (adminImages && request.method === 'POST') {
        const id = decodeURIComponent(adminImages[1])
        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) return jsonError('file is required', 400)
        const updated = await addProductImage(env, id, file)
        if (updated instanceof Response) return updated
        return json(updated, 201)
      }

      const adminImage = pathname.match(/^\/api\/admin\/products\/([^/]+)\/images\/([^/]+)$/)
      if (adminImage && request.method === 'DELETE') {
        const updated = await removeProductImage(
          env,
          decodeURIComponent(adminImage[1]),
          decodeURIComponent(adminImage[2]),
        )
        if (updated instanceof Response) return updated
        return json(updated)
      }

      return jsonError('Not found', 404)
    }

    if (pathname.startsWith('/api/')) {
      return jsonError('Not found', 404)
    }

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
