import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FREE_SHIPPING_THRESHOLD } from '../data/storefront'
import { itemKey } from '../lib/format'
import { useCatalog } from './CatalogContext'
import type { CartItem } from '../types'

type CartContextValue = {
  items: CartItem[]
  wishlist: string[]
  addItem: (productId: string, options?: { scent?: string; quantity?: number }) => void
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  toggleWishlist: (productId: string) => void
  isWished: (productId: string) => boolean
  subtotal: number
  itemCount: number
  remainingForFreeShipping: number
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_KEY = 'fleur-lumiere-cart'
const WISH_KEY = 'fleur-lumiere-wishlist'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { getById } = useCatalog()
  const [items, setItems] = useState<CartItem[]>(() => readJson(CART_KEY, []))
  const [wishlist, setWishlist] = useState<string[]>(() => readJson(WISH_KEY, []))

  const persistCart = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem(CART_KEY, JSON.stringify(next))
  }

  const persistWish = (next: string[]) => {
    setWishlist(next)
    localStorage.setItem(WISH_KEY, JSON.stringify(next))
  }

  const addItem = useCallback(
    (productId: string, options?: { scent?: string; quantity?: number }) => {
      const product = getById(productId)
      if (product && product.stock <= 0) return
      const key = itemKey(productId, options?.scent)
      const quantity = options?.quantity ?? 1
      persistCart(
        (() => {
          const current = readJson<CartItem[]>(CART_KEY, [])
          const existing = current.find((item) => item.key === key)
          const nextQty = (existing?.quantity ?? 0) + quantity
          const capped = product ? Math.min(nextQty, product.stock) : nextQty
          if (existing) {
            return current.map((item) => (item.key === key ? { ...item, quantity: capped } : item))
          }
          return [...current, { key, productId, scent: options?.scent, quantity: capped }]
        })(),
      )
    },
    [getById],
  )

  const removeItem = useCallback((key: string) => {
    persistCart(readJson<CartItem[]>(CART_KEY, []).filter((item) => item.key !== key))
  }, [])

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity < 1) {
        persistCart(readJson<CartItem[]>(CART_KEY, []).filter((item) => item.key !== key))
        return
      }
      persistCart(
        readJson<CartItem[]>(CART_KEY, []).map((item) => {
          if (item.key !== key) return item
          const product = getById(item.productId)
          const capped = product ? Math.min(quantity, product.stock) : quantity
          return { ...item, quantity: capped }
        }),
      )
    },
    [getById],
  )

  const clear = useCallback(() => persistCart([]), [])

  const toggleWishlist = useCallback((productId: string) => {
    const current = readJson<string[]>(WISH_KEY, [])
    persistWish(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }, [])

  const isWished = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  )

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = getById(item.productId)
        return sum + (product ? product.price * item.quantity : 0)
      }, 0),
    [items, getById],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const value = useMemo(
    () => ({
      items,
      wishlist,
      addItem,
      removeItem,
      setQuantity,
      clear,
      toggleWishlist,
      isWished,
      subtotal,
      itemCount,
      remainingForFreeShipping,
    }),
    [
      items,
      wishlist,
      addItem,
      removeItem,
      setQuantity,
      clear,
      toggleWishlist,
      isWished,
      subtotal,
      itemCount,
      remainingForFreeShipping,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
