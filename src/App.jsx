import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductConfigurator from '@/pages/ProductConfigurator';
import Cart from '@/pages/Cart';
import CheckoutResult from '@/pages/CheckoutResult';
import Admin from '@/pages/Admin';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Returns from '@/pages/Returns';
import FAQ from '@/pages/FAQ';

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Helmet>
              <title>Print Market - Custom Apparel Printing</title>
              <meta name="description" content="Professional DTF and UV printing services for custom apparel. Design your own t-shirts, hoodies, and more with instant quotes." />
            </Helmet>
            <Header />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:sku" element={<ProductConfigurator />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout/success" element={<CheckoutResult success={true} />} />
                <Route path="/checkout/cancel" element={<CheckoutResult success={false} />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/returns" element={<Returns />} />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;