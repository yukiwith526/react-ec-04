import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type UiContextValue = {
  cartOpen: boolean
  navOpen: boolean
  searchOpen: boolean
  toast: string | null
  openCart: () => void
  closeCart: () => void
  openNav: () => void
  closeNav: () => void
  openSearch: () => void
  closeSearch: () => void
  notify: (message: string) => void
}

const UiContext = createContext<UiContextValue | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }, [])

  const value = useMemo(
    () => ({
      cartOpen,
      navOpen,
      searchOpen,
      toast,
      openCart: () => {
        setNavOpen(false)
        setSearchOpen(false)
        setCartOpen(true)
      },
      closeCart: () => setCartOpen(false),
      openNav: () => {
        setCartOpen(false)
        setSearchOpen(false)
        setNavOpen(true)
      },
      closeNav: () => setNavOpen(false),
      openSearch: () => {
        setCartOpen(false)
        setNavOpen(false)
        setSearchOpen(true)
      },
      closeSearch: () => setSearchOpen(false),
      notify,
    }),
    [cartOpen, navOpen, searchOpen, toast, notify],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}
