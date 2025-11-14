import React, { useEffect, Suspense, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { ActionLoggerProvider } from '@/hooks/useActionLogger';
import DevErrorBoundary from '@/components/DevErrorBoundary';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
const ProductConfigurator = React.lazy(() => import('@/pages/ProductConfigurator'));
import Cart from '@/pages/Cart';
import CheckoutResult from '@/pages/CheckoutResult';
import ThankYou from '@/pages/ThankYou';
import ThankYouCC from '@/pages/ThankYouCC';
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
import Works from '@/pages/Works';
import Contact from '@/pages/Contact';
import WinterCampaign from '@/pages/WinterCampaign';

/* --------------------------------------------------------------------------
   Scroll-to-top on route change
-------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Google Ads + GA4 pageview tracking on SPA navigation
-------------------------------------------------------------------------- */
function AdsRouteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      const path = `${pathname}${search || ''}`;
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const KEY = '__aw_last_path';
        const last = window[KEY];

        if (last === path) return;

        if (last !== undefined) {
          window.gtag('config', 'AW-17646508237', { page_path: path });
          window.gtag('config', 'G-43KTYPJPNM', { page_path: path });
        }

        window[KEY] = path;
      }
    } catch {}
  }, [pathname, search]);
  return null;
}

/* --------------------------------------------------------------------------
   Google Ads tracking sync: gclid, utm_source, device, etc.
-------------------------------------------------------------------------- */
function extractGclidFromCookieValue(raw) {
  if (!raw) return '';
  const value = String(raw).trim();
  const segments = value.split('.');
  if (segments.length >= 3) {
    const candidate = segments[segments.length - 1];
    return candidate ? candidate.trim() : '';
  }
  return value;
}

function readGclidFromCookies() {
  if (typeof document === 'undefined') return '';
  try {
    const cookieSource = document.cookie || '';
    if (!cookieSource) return '';

    const entries = cookieSource.split(';');
    for (const entry of entries) {
      const pair = entry.trim();
      if (!pair) continue;
      const [key, ...rest] = pair.split('=');
      if (!key || rest.length === 0) continue;
      const lowerKey = key.trim().toLowerCase();

      if (lowerKey === 'gclid') {
        return decodeURIComponent(rest.join('=')).trim();
      }

      if (lowerKey === '_gcl_aw' || lowerKey === '_gcl_dc') {
        return extractGclidFromCookieValue(decodeURIComponent(rest.join('=')));
      }
    }
  } catch {}
  return '';
}

function readStoredGoogleAds() {
  if (typeof window === 'undefined') return {};

  const readJson = (storage) => {
    try {
      const raw = storage?.getItem('printee:last-googleads');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  return (
    readJson(window.sessionStorage) ||
    readJson(window.localStorage) ||
    {}
  );
}

function writeStoredGoogleAds(data) {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(data);
  try { window.sessionStorage.setItem('printee:last-googleads', serialized); } catch {}
  try { window.localStorage.setItem('printee:last-googleads', serialized); } catch {}

  if (data.gclid) {
    try { window.sessionStorage.setItem('printee:last-gclid', data.gclid); } catch {}
    try { window.localStorage.setItem('printee:last-gclid', data.gclid); } catch {}
  }
}

function detectDeviceCategory() {
  if (typeof navigator === 'undefined') return '';

  const ua = navigator.userAgent || '';
  const isTablet =
    /ipad|tablet|nexus 7|nexus 9|nexus 10|xoom|silk|sm-t|kfapwi|kindle/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua));
  if (isTablet) return 'tablet';

  const isMobile =
    /mobi|iphone|ipod|android.+mobile|blackberry|iemobile|opera mini/i.test(ua);
  if (isMobile) return 'mobile';

  return 'desktop';
}

function TrackingSync() {
  const { payload, mergePayload } = useCart();
  const location = useLocation();
  const hydratedRef = useRef(false);

  // Initial hydration from cookie + saved storage
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const stored = readStoredGoogleAds();
    const cookieGclid = readGclidFromCookies();
    const current = payload?.tracking?.googleAds || {};
    const next = { ...current };

    let changed = false;

    if (!next.gclid) {
      const gclid = stored?.gclid || cookieGclid;
      if (gclid) {
        next.gclid = gclid;
        next.source ||= stored?.source || 'cookie';
        next.lastCapturedAt ||= stored?.lastCapturedAt || new Date().toISOString();
        changed = true;
      }
    }

    ['gbraid', 'wbraid', 'campaign', 'keyword', 'utmSource', 'utmMedium'].forEach((key) => {
      if (!next[key] && stored?.[key]) {
        next[key] = stored[key];
        changed = true;
      }
    });

    if (!changed) return;

    mergePayload({
      tracking: {
        ...(payload?.tracking || {}),
        googleAds: next,
      },
    });

    writeStoredGoogleAds(next);
  }, []);

  // Capture params from URL on route change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keys = [
      'gclid',
      'gbraid',
      'wbraid',
      'utm_campaign',
      'utm_term',
      'utm_source',
      'utm_medium',
    ];

    let changed = false;

    const current = payload?.tracking?.googleAds || {};
    const next = { ...current };

    const capturedAt = new Date().toISOString();

    const gclid = params.get('gclid')?.trim();
    const gbraid = params.get('gbraid')?.trim();
    const wbraid = params.get('wbraid')?.trim();
    const campaign = params.get('utm_campaign')?.trim();
    const keyword = params.get('utm_term')?.trim();
    const utmSource = params.get('utm_source')?.trim();
    const utmMedium = params.get('utm_medium')?.trim();

    if (gclid && gclid !== current.gclid) { next.gclid = gclid; changed = true; }
    if (gbraid && gbraid !== current.gbraid) { next.gbraid = gbraid; changed = true; }
    if (wbraid && wbraid !== current.wbraid) { next.wbraid = wbraid; changed = true; }
    if (campaign && campaign !== current.campaign) { next.campaign = campaign; changed = true; }
    if (keyword && keyword !== current.keyword) { next.keyword = keyword; changed = true; }
    if (utmSource && utmSource !== current.utmSource) { next.utmSource = utmSource; changed = true; }
    if (utmMedium && utmMedium !== current.utmMedium) { next.utmMedium = utmMedium; changed = true; }

    if (!changed) return;

    next.source = 'url_param';
    next.lastCapturedAt = capturedAt;

    mergePayload({
      tracking: {
        ...(payload?.tracking || {}),
        googleAds: next,
      },
    });

    writeStoredGoogleAds(next);
  }, [location.search]);

  // Track device type
  useEffect(() => {
    const device = detectDeviceCategory();
    const current = payload?.tracking?.metadata?.device || '';
    if (device && current !== device) {
      mergePayload({
        tracking: {
          ...(payload?.tracking || {}),
          metadata: { device },
        },
      });
    }
  }, []);

  return null;
}

/* --------------------------------------------------------------------------
   App Component
-------------------------------------------------------------------------- */
function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <ActionLoggerProvider>
          <DevErrorBoundary>
            <Router>
              <TrackingSync />
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <Helmet>
                  <title>Printeam – Custom Apparel Printing</title>
                  <meta
                    name="description"
                    content="Custom apparel printing: design t-shirts, hoodies & more. Fast quotes, quality prints, delivery across Israel."
                  />
                </Helmet>

                <Header />
                <ScrollToTop />
                <AdsRouteTracker />

                <main className="min-h-screen">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />

                    <Route
                      path="/product/:sku"
                      element={
                        <Suspense fallback={<div className="min-h-screen" />}>
                          <ProductConfigurator />
                        </Suspense>
                      }
                    />

                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout/success" element={<CheckoutResult success={true} />} />
                    <Route path="/checkout/cancel" element={<CheckoutResult success={false} />} />

                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/thank-you-cc" element={<ThankYouCC />} />

                    <Route path="/admin" element={<Admin />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/print-quality" element={<PrintQuality />} />
                    <Route path="/garments-quality" element={<GarmentsQuality />} />
                    <Route path="/service-quality" element={<ServiceQuality />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/methods-of-branding" element={<MethodsOfBranding />} />
                    <Route path="/accessibility" element={<AccessibilityStatement />} />
                    <Route path="/works" element={<Works />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/winter-campaign" element={<WinterCampaign />} />

                    {process.env.NODE_ENV !== 'production' && (
                      <Route path="/dev/composer" element={<DevComposer />} />
                    )}
                  </Routes>
                </main>

                <Footer />
                <Toaster />
                <WhatsAppWidget />
              </div>
            </Router>
          </DevErrorBoundary>
        </ActionLoggerProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;