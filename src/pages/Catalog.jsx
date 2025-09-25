import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { products } from '@/data/products';
import { Button } from '@/components/ui/button';

const Catalog = () => {
  const { t, language } = useLanguage();
  const [selectedType, setSelectedType] = useState('all');

  const formatILS = (v) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(v);

  const productTypes = [
    { value: 'all', label: t('allTypes') },
    { value: 'tshirt', label: t('tshirt') },
    { value: 'hoodie', label: t('hoodie') },
    { value: 'sweatshirt', label: t('sweatshirt') }
  ];

  const filteredProducts = selectedType === 'all' 
    ? products 
    : products.filter(product => product.sku === selectedType);

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

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 py-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                {t('filterByType')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {productTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type.value)}
                  className="mb-2"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.sku}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={product.images.white}
                    alt={language === 'he' ? product.nameHe : product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                    onMouseEnter={e => { if (product.images?.mockup) e.currentTarget.src = product.images.mockup; }}
                    onMouseLeave={e => { e.currentTarget.src = product.images.white; }}
                  />
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'he' ? product.nameHe : product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {product.tech}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      מינימום 10 פריטים
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {(language === 'he' ? 'צבעים' : 'colors')}: {product.colors.length}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatILS(product.basePrice)}+
                    </span>
                  </div>

                  <div className="flex gap-2 mb-4" role="list" aria-label={language === 'he' ? 'צבעים זמינים' : 'Available colors'}>
                    {product.colors.slice(0, 4).map((color) => (
                      <button
                        type="button"
                        key={color}
                        className="w-6 h-6 rounded-full border-2 border-gray-200"
                        style={{ background: color === 'white' ? '#ffffff' : color }}
                        title={color}
                        aria-label={color}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{product.colors.length - 4}</span>
                      </div>
                    )}
                  </div>

                  <Link to={`/product/${product.sku}`}>
                    <Button className="w-full">
                      {t('startDesigning')}
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