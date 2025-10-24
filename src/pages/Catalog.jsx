import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, pricingRules } from '@/data/products';
import { Button } from '@/components/ui/button';

const Catalog = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Preload first row images for faster first paint on catalog
  useEffect(() => {
    try {
      const toPreload = [...products].slice(0, 6);
      toPreload.forEach((p) => {
        const src = pick(p.images?.base1, `/product_images/${p.sku}/base_1.webp`);
        const img = new Image();
        img.src = src;
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
    return arr.find(x => /\.(jpe?g|png)$/.test(x)) || arr[0];
  };

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
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('catalogTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('catalogSubtitle')}
            </p>
          </motion.div>

          {/* Products Grid - show two products per row on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {([...products].sort((a, b) => (a.appearance || 0) - (b.appearance || 0))).map((product, index) => (
              <motion.div
                key={product.sku}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer flex flex-col"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/product/${product.sku}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product/${product.sku}`);
                  }
                }}
              >
                <div className="aspect-square overflow-hidden bg-gray-50 flex-shrink-0 pt-1">
                  <img
                    src={pick(product.images?.base1, `/product_images/${product.sku}/base_1.webp`)}
                    alt={language === 'he' ? product.nameHe : product.name}
                    // On mobile use object-cover but align to top so heads remain visible; on sm+ screens use object-contain
                    className="w-full h-full object-cover object-top sm:object-contain transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.dataset.prev = el.src;
                      const next = pick(product.images?.base2, `/product_images/${product.sku}/base_2.webp`);
                      el.src = next;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      if (el.dataset.prev) el.src = el.dataset.prev;
                      else el.src = pick(product.images?.base1, `/product_images/${product.sku}/base_1.webp`);
                    }}
                    onError={e => {
                      const el = e.currentTarget;
                      try {
                        const pathname = new URL(el.src, window.location.origin).pathname;
                        const list = Array.isArray(product.images?.base1) ? product.images.base1 : null;
                        if (list) {
                          const idx = list.findIndex(item => pathname.endsWith(item));
                          if (idx >= 0 && idx < list.length - 1) {
                            el.src = list[idx + 1];
                            return;
                          }
                        }
                      } catch (err) {
                        // fall back to simple string comparisons if URL parsing fails
                      }
                      if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.jpg');
                      else if (el.src.endsWith('.jpg')) el.src = el.src.replace('.jpg', '.jpeg');
                      else if (el.src.endsWith('.jpeg')) el.src = el.src.replace('.jpeg', '.png');
                    }}
                  />
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
                        const min = tiers.length ? Math.min(...tiers.map(t => t.price)) : product.basePrice;
                        return language === 'he' 
                          ? `מחיר המוצר מ-${formatILS(min)}`
                          : `The price of the item is from ${formatILS(min)}`;
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
                        img.src = pick(product.images?.base1, `/product_images/${product.sku}/base_1.webp`);
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

export default Catalog;