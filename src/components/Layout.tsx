import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useUi } from '../context/UiContext'
import { AnnouncementBar, Header } from './Header'
import { Footer } from './Footer'
import { CartDrawer } from './CartDrawer'
import { NavDrawer } from './NavDrawer'
import { SearchModal } from './SearchModal'

export function Layout() {
  const { toast, cartOpen, navOpen, searchOpen } = useUi()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = cartOpen || navOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen, navOpen, searchOpen])

  return (
    <div className="app-shell">
      <AnnouncementBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <NavDrawer />
      <CartDrawer />
      <SearchModal />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
