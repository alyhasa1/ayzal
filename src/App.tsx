import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CartProvider } from '@/hooks/useCart';
import Navigation from '@/components/Navigation';
import MenuDrawer from '@/components/MenuDrawer';
import CartDrawer from '@/components/CartDrawer';
import RequireAuth from '@/components/RequireAuth';
import RequireAdmin from '@/components/RequireAdmin';
import HomePage from '@/pages/HomePage';
import ProductPage from '@/pages/ProductPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminSections from '@/pages/admin/AdminSections';
import AdminTestimonials from '@/pages/admin/AdminTestimonials';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminSettings from '@/pages/admin/AdminSettings';
import AccountLogin from '@/pages/account/AccountLogin';
import AccountLayout from '@/pages/account/AccountLayout';
import AccountOrders from '@/pages/account/AccountOrders';
import AccountOrderDetail from '@/pages/account/AccountOrderDetail';
import AccountProfile from '@/pages/account/AccountProfile';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    // Refresh ScrollTrigger on route change
    ScrollTrigger.refresh();
  }, [pathname]);
  
  return null;
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/product/');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAccountRoute = location.pathname.startsWith('/account');
  const showStoreNav = !isAdminRoute && !isAccountRoute;

  void isProductPage;

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <div className="relative">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {showStoreNav && (
        <>
          <Navigation onMenuOpen={() => setIsMenuOpen(true)} />
          <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
          <CartDrawer />
        </>
      )}

      {/* Main Content */}
      <main className="relative">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth redirectTo="/account/login">
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route path="/account/login" element={<AccountLogin />} />
          <Route
            path="/account"
            element={
              <RequireAuth redirectTo="/account/login">
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AccountOrders />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:id" element={<AccountOrderDetail />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
