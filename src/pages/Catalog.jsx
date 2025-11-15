import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, pricingRules } from '@/data/products';
import { Button } from '@/components/ui/button';

const QUICK_FILTERS = [
  { key: 'all', labelEn: 'All', labelHe: 'כל המוצרים' },
  { key: 'short_sleeve', labelEn: 'Short Sleeve', labelHe: 'שרוול קצר' },
  // Keep winter defined but hidden until the collection is ready again
  { key: 'winter', labelEn: 'Winter', labelHe: 'חורף', hidden: true }
];

const VISIBLE_FILTERS = QUICK_FILTERS.filter((filter) => !filter.hidden);

const Catalog = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState(VISIBLE_FILTERS[0]?.key || QUICK_FILTERS[0].key);

  // Preload first row images for faster first paint on catalog
  useEffect(() => {
    try {
      const toPreload = [...products].slice(0, 6);
      toPreload.forEach((p) => {
        const front = pick(p.images?.base1, `/product_images/${p.sku}/base1_${p.sku}.png`);
        const back = pick(p.images?.base2, `/product_images/${p.sku}/base2_${p.sku}.png`);
        const img1 = new Image();
        img1.src = rewriteLegacy(front, p.sku);
        const img2 = new Image();
        img2.src = rewriteLegacy(back, p.sku);
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const formatILS = (v) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(v);
  
  // pick the first suitable raster image from an array or fallback
  const pick = (arr, fallback) => {
    if (!Array.isArray(arr) || !arr.length) return fallback;
    return arr.find(x => /(\.jpe?g|\.png)$/i.test(x)) || arr[0];
  };

  // rewrite any legacy /base_1 or /base_2 to /base1_<sku> or /base2_<sku>
  const rewriteLegacy = (src, sku) => {
    if (!src || typeof src !== 'string') return src;
    try {
      const m = src.match(/^(.*)\/base_(1|2)(\.[^.]+)?$/);
      if (m) {
        const ext = m[3] || '.png';
        return `/product_images/${sku}/base${m[2]}_${sku}${ext}`;
      }
    } catch {}
    return src;
  };

  // derive same-folder base path without extension
  const deriveBase = (src) => {
    if (!src || typeof src !== 'string') return null;
    const m = src.match(/(.+?)\.[^.]+$/);
    return m ? m[1] : null;
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (a.appearance || 0) - (b.appearance || 0)),
    []
  );

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return sortedProducts;
    return sortedProducts.filter((product) => {
      const tags = Array.isArray(product.search_tag) ? product.search_tag : ['all'];
      return tags.includes(activeFilter);
    });
  }, [activeFilter, sortedProducts]);

  return (
    <>
      <Helmet>
        <title>{t('catalogTitle')} – Printeam</title>
        <meta name="description" content={t('catalogSubtitle')} />
        <link rel="canonical" href="https://printeam.co.il/catalog" />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('catalogTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('catalogSubtitle')}
            </p>
          </motion.div>

          {/* Quick filter tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {VISIBLE_FILTERS.map((filter) => {
              const isActive = filter.key === activeFilter;
              return (
                <button
                  key={filter.key}
                  type="button"
                  className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={isActive}
                >
                  {language === 'he' ? filter.labelHe : filter.labelEn}
                </button>
              );
            })}
          </div>

          {/* Products Grid - show two products per row on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.sku}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer flex flex-col group"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/product/${product.sku}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product/${product.sku}`);
                  }
                }}
                onMouseEnter={() => {
                  // warm up base images for instant hover
                  try {
                    const f = rewriteLegacy(pick(product.images?.base1, `/product_images/${product.sku}/base1_${product.sku}.png`), product.sku);
                    const b = rewriteLegacy(pick(product.images?.base2, `/product_images/${product.sku}/base2_${product.sku}.png`), product.sku);
                    const i1 = new Image(); i1.src = f;
                    const i2 = new Image(); i2.src = b;
                  } catch {}
                }}
              >
                <div className="aspect-square overflow-hidden bg-gray-50 flex-shrink-0 pt-1 relative">
                  {(() => {
                    const primaryRaster = rewriteLegacy(pick(product.images?.base1, `/product_images/${product.sku}/base1_${product.sku}.png`), product.sku);
                    const secondaryRaster = rewriteLegacy(pick(product.images?.base2, `/product_images/${product.sku}/base2_${product.sku}.png`), product.sku);
                    const primaryBase = deriveBase(primaryRaster);
                    const secondaryBase = deriveBase(secondaryRaster);
                    const webpPrimary = primaryBase ? `${primaryBase}.webp` : null;
                    const webpSecondary = secondaryBase ? `${secondaryBase}.webp` : null;

                    return (
                      <FlipTile
                        primaryRaster={primaryRaster}
                        webpPrimary={webpPrimary}
                        secondaryRaster={secondaryRaster}
                        webpSecondary={webpSecondary}
                        alt={language === 'he' ? product.nameHe : product.name}
                      />
                    );
                  })()}
                </div>

                <div className="p-3 sm:p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'he' ? product.nameHe : product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {(language === 'he' ? 'צבעים' : 'colors')}:
                      <span className="inline-flex items-center ml-2 bg-blue-50 text-blue-700 text-sm font-medium px-2 py-0.5 rounded-full">
                        {product.colors.length}
                      </span>
                    </span>
                    <span className="text-sm sm:text-lg font-bold text-blue-600">
                      {(() => {
                        const tiers = pricingRules[product.sku]?.tiers || [];
                        // Compute the lowest per-unit price across all tiers (numeric min)
                        const prices = tiers.map(t => Number(t.price)).filter(n => Number.isFinite(n));
                        const fromPrice = prices.length ? Math.min(...prices) : Number(product.basePrice || 0);
                        return language === 'he'
                          ? `מחיר המוצר מ-${formatILS(fromPrice)}`
                          : `The price of the item is from ${formatILS(fromPrice)}`;
                      })()}
                    </span>
                  </div>

                  {/* color swatches removed per request; keep the color counter above */}

                  <div className="mt-auto">
                    <Link
                    to={`/product/${product.sku}`}
                    onMouseEnter={() => {
                      // Prefetch product image and product page bundle on hover
                      try {
                        const img = new Image();
                        let src = pick(product.images?.base1, `/product_images/${product.sku}/base1_${product.sku}.png`);
                        src = rewriteLegacy(src, product.sku);
                        img.src = src;
                        const img2 = new Image();
                        let src2 = pick(product.images?.base2, `/product_images/${product.sku}/base2_${product.sku}.png`);
                        src2 = rewriteLegacy(src2, product.sku);
                        img2.src = src2;
                      } catch (e) {}
                      // Dynamic import to warm the product page JS bundle (best-effort)
                      try { import(/* webpackPrefetch: true */ '@/pages/ProductConfigurator'); } catch (e) {}
                    }}
                    onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Button className="w-full" onClick={(e) => { /* ensure button click doesn't bubble to card */ e.stopPropagation(); }}>
                        {language === 'he' ? 'בחר מוצר' : t('startDesigning')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Small client-side-only tile that auto-flips on mobile every ~3s with random start
function FlipTile({ primaryRaster, webpPrimary, secondaryRaster, webpSecondary, alt }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (rm && rm.matches) return undefined;
    const mq = window.matchMedia && window.matchMedia('(max-width: 768px)');
    const isMobile = !!(mq && mq.matches);
    if (!isMobile) return undefined; // only auto-flip on mobile

    let mounted = true;
    // randomized start offset up to 3s
    const startOffset = Math.floor(Math.random() * 3000);
    const intervalMs = 3000;
    let intervalHandle = null;
    const t = setTimeout(() => {
      if (!mounted) return;
      setFlipped((s) => !s);
      intervalHandle = setInterval(() => {
        setFlipped((s) => !s);
      }, intervalMs);
    }, startOffset);

    return () => {
      mounted = false;
      clearTimeout(t);
      if (intervalHandle) clearInterval(intervalHandle);
    };
  }, []);

  return (
    <div className="flip-3d">
      <div className={`flip-3d-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-face">
          <picture>
            {webpPrimary && <source type="image/webp" srcSet={webpPrimary} />}
            <img src={primaryRaster} alt={alt} className="w-full h-full object-cover object-top sm:object-contain" loading="lazy" decoding="async" />
          </picture>
        </div>
        <div className="flip-face flip-back">
          <picture>
            {webpSecondary && <source type="image/webp" srcSet={webpSecondary} />}
            <img src={secondaryRaster} alt={alt} className="w-full h-full object-cover object-top sm:object-contain" loading="lazy" decoding="async" />
          </picture>
        </div>
      </div>
    </div>
  );
}

export default Catalog;