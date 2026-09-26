import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CatalogProvider } from './context/CatalogContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { UiProvider } from './context/UiContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { ProductDetail } from './pages/ProductDetail'
import { About } from './pages/About'
import { Login } from './pages/Login'
import { VerifyEmail } from './pages/VerifyEmail'
import { Account } from './pages/Account'
import { Checkout } from './pages/Checkout'
import { CheckoutSuccess } from './pages/CheckoutSuccess'
import { Shipping } from './pages/Shipping'
import { LegalTokushoho } from './pages/LegalTokushoho'
import { LegalPrivacy } from './pages/LegalPrivacy'
import { NotFound } from './pages/NotFound'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminProductForm } from './pages/admin/AdminProductForm'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail'
import { AdminCustomers } from './pages/admin/AdminCustomers'
import { AdminCustomerDetail } from './pages/admin/AdminCustomerDetail'

export default function App() {
  return (
    <CatalogProvider>
      <AuthProvider>
      <CartProvider>
        <UiProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/:id" element={<AdminCustomerDetail />} />
              </Route>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/account" element={<Account />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/tokushoho" element={<LegalTokushoho />} />
                <Route path="/privacy" element={<LegalPrivacy />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </UiProvider>
      </CartProvider>
      </AuthProvider>
    </CatalogProvider>
  )
}
