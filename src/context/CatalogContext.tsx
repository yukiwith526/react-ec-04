import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchProducts } from '../lib/api'
import type { Category, Product } from '../types'

type CatalogContextValue = {
  products: Product[]
  loading: boolean
  error: string | null
  reload: () => void
  getById: (id: string) => Product | undefined
  getBySlug: (slug: string) => Product | undefined
  byCategory: (category?: Category) => Product[]
  newArrivals: () => Product[]
  search: (query: string) => Product[]
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '商品の読み込みに失敗しました')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const getById = useCallback((id: string) => products.find((product) => product.id === id), [products])
  const getBySlug = useCallback((slug: string) => products.find((product) => product.slug === slug), [products])
  const byCategory = useCallback(
    (category?: Category) => (category ? products.filter((product) => product.category === category) : products),
    [products],
  )
  const newArrivals = useCallback(() => products.filter((product) => product.isNew), [products])
  const search = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return []
      return products.filter((product) =>
        [product.name, product.nameJa, product.categoryJa, product.category, product.description]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    },
    [products],
  )

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      reload: () => setTick((n) => n + 1),
      getById,
      getBySlug,
      byCategory,
      newArrivals,
      search,
    }),
    [products, loading, error, getById, getBySlug, byCategory, newArrivals, search],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
