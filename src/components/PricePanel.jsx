import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

const PricePanel = ({ pricing, selectedAreas, canAddToCart, onAddToCart }) => {
  const { t, language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  const toggleExpand = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="price-panel p-6 bg-white rounded-xl shadow-lg lg:sticky lg:top-24"
    >
      <div className="flex justify-between items-center cursor-pointer lg:cursor-default" onClick={toggleExpand}>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('priceBreakdown')}
        </h2>
        {isMobile && (
          isExpanded ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 mb-6 pt-6">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('totalQuantity')}</span>
                <span className="font-medium">{pricing.totalQty} {language === 'he' ? 'פריטים' : 'units'}</span>
              </div>

              {pricing.totalQty > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('basePrice')}</span>
                    <span className="font-medium">
                      ₪{pricing.breakdown.unitBase} × {pricing.totalQty} = ₪{pricing.breakdown.baseTotal?.toLocaleString()}
                    </span>
                  </div>

                  {selectedAreas.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('placementFees')}</span>
                        <span className="font-medium">₪{pricing.breakdown.placementFeesTotal?.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1 pl-4">
                        {selectedAreas.map((areaKey) => {
                          // selectedAreas may be array of objects { areaKey, method } or strings
                          const sel = typeof areaKey === 'string' ? { areaKey, method: 'print' } : areaKey;
                          const area = printAreas[sel.areaKey];
                          const feePerUnit = sel.method === 'print' ? (area?.fee || 0) : 10; // embo per-unit fee
                          const label = language === 'he' ? area?.labelHe : area?.label;
                          const methodLabel = sel.method === 'embo' ? (language === 'he' ? 'רקמה' : 'Embo') : (language === 'he' ? 'הדפסה' : 'Print');
                          return (
                            <div key={sel.areaKey} className="flex justify-between">
                              <span>{label} • {methodLabel}</span>
                              <span>₪{feePerUnit} × {pricing.totalQty} = ₪{(feePerUnit * pricing.totalQty).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {pricing.breakdown && pricing.breakdown.emboFeeTotal > 0 && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>{language === 'he' ? 'דמי גלופה (חד פעמי)' : 'Embo development fee (one-time)'}</span>
                        <span className="font-medium">₪{(pricing.breakdown.emboFeeTotal - (pricing.breakdown.emboUnitsCount * pricing.totalQty * 10)).toLocaleString()}</span>
                      </div>
                      
                    </div>
                  )}

                  {pricing.breakdown.deliveryCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('delivery')}</span>
                      <span className="font-medium">
                        +₪{pricing.breakdown.deliveryCost?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">{t('total')}</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₪{pricing.totalIls?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {pricing.totalQty >= 10 && selectedAreas.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center text-yellow-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{t('selectPrintArea')}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!canAddToCart}
              onClick={onAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t('addToCart')}
            </Button>

            {/* Show reason why add-to-cart is disabled */}
            {!canAddToCart && (
              <div className="mt-3 text-sm text-red-600 text-center">
                {pricing.totalQty === 0 ? null : t('selectPrintArea')}
              </div>
            )}

            <div className="mt-3">
              <Link to="/cart" className="w-full inline-block">
                <button className="w-full bg-white border border-gray-200 rounded px-4 py-3 text-sm text-gray-700">
                  {language === 'he' ? 'עבור לעגלה' : 'Go to cart'}
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PricePanel;