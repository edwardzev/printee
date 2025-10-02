import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, pricingRules } from '@/data/products';
import { Button } from '@/components/ui/button';

const Catalog = () => {
  const { t, language } = useLanguage();

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
        <title>{t('catalogTitle')} – Printee</title>
        <meta name="description" content={t('catalogSubtitle')} />
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

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {([...products].sort((a, b) => (a.appearance || 0) - (b.appearance || 0))).map((product, index) => (
              <motion.div
                key={product.sku}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={pick(product.images?.base1, `/product_images/${product.sku}/base_1.webp`)}
                    alt={language === 'he' ? product.nameHe : product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
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
                
                <div className="p-6">
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
                    <span className="text-lg font-bold text-blue-600">
                      {(() => {
                        const tiers = pricingRules[product.sku]?.tiers || [];
                        const min = tiers.length ? Math.min(...tiers.map(t => t.price)) : product.basePrice;
                        return `מ־${formatILS(min)}`;
                      })()}
                    </span>
                  </div>

                  {/* color swatches removed per request; keep the color counter above */}

                  <Link to={`/product/${product.sku}`}>
                    <Button className="w-full">
                      {language === 'he' ? 'בחר מוצר' : t('startDesigning')}
                    </Button>
                  </Link>
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