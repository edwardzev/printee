import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import DevErrorBoundary from '@/components/DevErrorBoundary';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductConfigurator from '@/pages/ProductConfigurator';
import Cart from '@/pages/Cart';
import CheckoutResult from '@/pages/CheckoutResult';
import ThankYou from '@/pages/ThankYou';
import ThankYouCC from '@/pages/ThankYouCC';
// Backend removed: iCount thank-you route may be unused but can remain if purely client-side
import Admin from '@/pages/Admin';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Returns from '@/pages/Returns';
import FAQ from '@/pages/FAQ';
import PrintQuality from '@/pages/PrintQuality';
import GarmentsQuality from '@/pages/GarmentsQuality';
import ServiceQuality from '@/pages/ServiceQuality';
import DevComposer from '@/pages/DevComposer';
import MethodsOfBranding from '@/pages/MethodsOfBranding';
import AccessibilityStatement from '@/pages/AccessibilityStatement';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);
  return null;
}

// Send Google Ads page_view on SPA route changes
function AdsRouteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      const path = `${pathname}${search || ''}`;
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const KEY = '__aw_last_path';
        const last = window[KEY];
        // Avoid double-firing on initial load (index.html already called gtag config)
        if (last === path) return;
        if (last !== undefined) {
          window.gtag('config', 'AW-17646508237', { page_path: path });
        }
        window[KEY] = path;
      }
    } catch {}
  }, [pathname, search]);
  return null;
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <DevErrorBoundary>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Helmet>
              <title>Printeam – Custom Apparel Printing</title>
              <meta name="description" content="Custom apparel printing: design your own t‑shirts, hoodies and more. Fast quotes, quality prints, delivery across Israel." />
            </Helmet>
            <Header />
            <ScrollToTop />
            <AdsRouteTracker />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:sku" element={<ProductConfigurator />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout/success" element={<CheckoutResult success={true} />} />
                <Route path="/checkout/cancel" element={<CheckoutResult success={false} />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/thank-you-cc" element={<ThankYouCC />} />
                { /* Backend removed: iCount thank-you route disabled */ }
                <Route path="/admin" element={<Admin />} />
                { /* Backend dev pages removed */ }
                <Route path="/faq" element={<FAQ />} />
                <Route path="/print-quality" element={<PrintQuality />} />
                <Route path="/garments-quality" element={<GarmentsQuality />} />
                <Route path="/service-quality" element={<ServiceQuality />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/methods-of-branding" element={<MethodsOfBranding />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                {process.env.NODE_ENV !== 'production' && (
                  <Route path="/dev/composer" element={<DevComposer />} />
                )}
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
          </Router>
        </DevErrorBoundary>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;