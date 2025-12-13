import React, { useEffect, Suspense, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
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
import Works from '@/pages/Works';
import Contact from '@/pages/Contact';
import {
  readStoredGoogleAds,
  writeStoredGoogleAds,
  readGclidFromCookies,
  detectDeviceCategory,
} from '@/lib/googleAdsTracking';

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

// Send Google Ads and GA4 page_view on SPA route changes
function AdsRouteTracker() {
  const { pathname, search } = useLocation();
  const initialRenderRef = useRef(true);
  useEffect(() => {
    try {
      const path = `${pathname}${search || ''}`;
      if (typeof window === 'undefined') return;
      const KEY = '__aw_last_path';

      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        window[KEY] = path;
        return;
      }

      if (typeof window.gtag !== 'function') return;

      const last = window[KEY];
      if (last === path) return;

      const pageLocation = (() => {
        try {
          return window.location?.href || path;
        } catch {
          return path;
        }
      })();
      const basePayload = { page_location: pageLocation, page_path: path };

      window.gtag('event', 'page_view', { ...basePayload, send_to: 'AW-17646508237' });
      window.gtag('event', 'page_view', { ...basePayload, send_to: 'G-43KTYPJPNM' });
      window[KEY] = path;
    } catch {}
  }, [pathname, search]);
  return null;
}

// helper functions moved to lib/googleAdsTracking.js

function TrackingSync() {
  const { payload, mergePayload } = useCart();
  const location = useLocation();
  const hydratedRef = useRef(false);

  // On first mount, attempt to hydrate tracking data from storage or cookies.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const currentAds = payload?.tracking?.googleAds || {};
    const currentMetadata = payload?.tracking?.metadata || {};
    const stored = readStoredGoogleAds();
    const cookieGclid = readGclidFromCookies();

    const nextAds = { ...currentAds };
    const nextMetadata = { ...currentMetadata };
    let changed = false;
    let metadataChanged = false;

    const ensureConversionTime = (timestamp, overwrite = false) => {
      if (!timestamp) return;
      if (!overwrite && nextMetadata.conversionTime) return;
      if (nextMetadata.conversionTime === timestamp) return;
      nextMetadata.conversionTime = timestamp;
      metadataChanged = true;
    };

    if (!nextAds.gclid) {
      const gclid = (stored?.gclid || cookieGclid || '').trim();
      if (gclid) {
        nextAds.gclid = gclid;
        if (!nextAds.source) nextAds.source = stored?.captureSource || (stored?.gclid ? 'storage' : (cookieGclid ? 'cookie' : nextAds.source));
        if (!nextAds.lastCapturedAt) nextAds.lastCapturedAt = stored?.lastCapturedAt || new Date().toISOString();
        changed = true;
        ensureConversionTime(stored?.conversionTime || stored?.lastCapturedAt || new Date().toISOString(), !currentMetadata.conversionTime);
      }
    }

    const copyField = (key, value, overwrite = false) => {
      if (!value) return;
      if (overwrite) {
        if (nextAds[key] !== value) {
          nextAds[key] = value;
          changed = true;
        }
        return;
      }
      if (!nextAds[key]) {
        nextAds[key] = value;
        changed = true;
      }
    };

    copyField('gbraid', stored?.gbraid);
    copyField('wbraid', stored?.wbraid);
    copyField('campaign', stored?.campaign);
    copyField('keyword', stored?.keyword);
    copyField('utmSource', stored?.utmSource);
    copyField('utmMedium', stored?.utmMedium);
    copyField('source', stored?.captureSource);
    copyField('lastCapturedAt', stored?.lastCapturedAt);

    if (!nextMetadata.conversionTime && stored?.conversionTime) {
      ensureConversionTime(stored.conversionTime);
    }

    if (!changed && !metadataChanged) return;

    try {
      mergePayload({
        tracking: {
          ...(payload?.tracking || {}),
          googleAds: nextAds,
          metadata: {
            ...nextMetadata,
          },
        },
      });
    } catch (e) {
      try { console.warn('[TrackingSync] mergePayload failed on hydrate', e?.message || String(e)); } catch (_) {}
    }

    writeStoredGoogleAds(nextAds, { conversionTime: nextMetadata.conversionTime });
  }, [mergePayload, payload?.tracking]);

  // On every route change, capture tracking params from the URL.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = location?.search || window.location.search || '';
    if (!search) return;
    const params = new URLSearchParams(search);
    const gclidParam = (params.get('gclid') || '').trim();
    const gbraidParam = (params.get('gbraid') || '').trim();
    const wbraidParam = (params.get('wbraid') || '').trim();
    const utmCampaignParam = (params.get('utm_campaign') || params.get('campaign') || '').trim();
    const keywordParam = (params.get('utm_term') || params.get('keyword') || params.get('searchkeyword') || '').trim();
    const utmSourceParam = (params.get('utm_source') || '').trim();
    const utmMediumParam = (params.get('utm_medium') || '').trim();
    if (!gclidParam && !gbraidParam && !wbraidParam && !utmCampaignParam && !keywordParam && !utmSourceParam && !utmMediumParam) return;

    const currentAds = payload?.tracking?.googleAds || {};
    const currentMetadata = payload?.tracking?.metadata || {};
    const nextAds = { ...currentAds };
    const nextMetadata = { ...currentMetadata };
    const capturedAt = new Date().toISOString();
    let changed = false;
    let metadataChanged = false;

    const ensureConversionTime = (timestamp, overwrite = false) => {
      if (!timestamp) return;
      if (!overwrite && nextMetadata.conversionTime) return;
      if (nextMetadata.conversionTime === timestamp) return;
      nextMetadata.conversionTime = timestamp;
      metadataChanged = true;
    };

    if (gclidParam && gclidParam !== currentAds.gclid) {
      nextAds.gclid = gclidParam;
      changed = true;
      ensureConversionTime(capturedAt, true);
    }
    if (gbraidParam && gbraidParam !== currentAds.gbraid) {
      nextAds.gbraid = gbraidParam;
      changed = true;
    }
    if (wbraidParam && wbraidParam !== currentAds.wbraid) {
      nextAds.wbraid = wbraidParam;
      changed = true;
    }
    if (utmCampaignParam && utmCampaignParam !== currentAds.campaign) {
      nextAds.campaign = utmCampaignParam;
      changed = true;
    }
    if (keywordParam && keywordParam !== currentAds.keyword) {
      nextAds.keyword = keywordParam;
      changed = true;
    }
    if (utmSourceParam && utmSourceParam !== currentAds.utmSource) {
      nextAds.utmSource = utmSourceParam;
      changed = true;
    }
    if (utmMediumParam && utmMediumParam !== currentAds.utmMedium) {
      nextAds.utmMedium = utmMediumParam;
      changed = true;
    }

    if (!changed && !metadataChanged) return;

    nextAds.source = 'url_param';
    nextAds.lastCapturedAt = capturedAt;

    try {
      mergePayload({
        tracking: {
          ...(payload?.tracking || {}),
          googleAds: nextAds,
          metadata: {
            ...nextMetadata,
          },
        },
      });
    } catch (e) {
      try { console.warn('[TrackingSync] mergePayload failed on route change', e?.message || String(e)); } catch (_) {}
    }

    writeStoredGoogleAds(nextAds, { conversionTime: nextMetadata.conversionTime });
  }, [
    location?.search,
    mergePayload,
    payload?.tracking?.googleAds?.gclid,
    payload?.tracking?.googleAds?.gbraid,
    payload?.tracking?.googleAds?.wbraid,
    payload?.tracking?.googleAds?.campaign,
    payload?.tracking?.googleAds?.keyword,
    payload?.tracking?.googleAds?.utmSource,
    payload?.tracking?.googleAds?.utmMedium,
  ]);

  useEffect(() => {
    const device = detectDeviceCategory();
    if (!device) return;
    const currentDevice = payload?.tracking?.metadata?.device || '';
    if (currentDevice === device) return;
    try {
      mergePayload({
        tracking: {
          ...(payload?.tracking || {}),
          metadata: {
            ...(payload?.tracking?.metadata || {}),
            device,
          },
        },
      });
    } catch (e) {
      try { console.warn('[TrackingSync] mergePayload failed on device detection', e?.message || String(e)); } catch (_) {}
    }
  }, [mergePayload, payload?.tracking?.metadata?.device]);

  return null;
}

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <DevErrorBoundary>
          <Router>
            <TrackingSync />
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
                <Route
                  path="/product/:sku"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{/* loading */}</div>}>
                      <ProductConfigurator />
                    </Suspense>
                  }
                />
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
                <Route path="/works" element={<Works />} />
                <Route path="/contact" element={<Contact />} />
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