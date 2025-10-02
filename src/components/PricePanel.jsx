import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  // Desktop sidebar expanded (always true by default on desktop)
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  // Mobile bottom-sheet open state (default closed)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Whether the user has clicked Add to Cart at least once in this configurator session
  const [addedOnce, setAddedOnce] = useState(false);
  const sheetRef = useRef(null);
  const lastFocusedRef = useRef(null);

  // Robust scroll lock: freeze body when mobile sheet open, restore on close/unmount
  useEffect(() => {
    const lock = () => {
      const y = window.scrollY || window.pageYOffset;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${y}px`;
    };
    const unlock = () => {
      const top = document.body.style.top;
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (top) {
        const y = parseInt(top, 10) * -1;
        if (!Number.isNaN(y)) window.scrollTo(0, y);
      }
    };

    if (isSheetOpen) {
      lock();
    } else {
      unlock();
    }
    return () => unlock();
  }, [isSheetOpen]);

  // handle Escape key to close (mobile sheet only)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isSheetOpen) setIsSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSheetOpen]);

  // restore focus when closing (mobile sheet only)
  useEffect(() => {
    if (!isSheetOpen) {
      try { lastFocusedRef.current?.focus?.(); } catch {}
    } else {
      // move focus into sheet
      try { sheetRef.current?.focus?.(); } catch {}
    }
  }, [isSheetOpen]);

  const toggleExpand = () => {
    if (!isMobile) setIsDesktopExpanded((v) => !v);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="price-panel hidden lg:block p-6 bg-white rounded-xl shadow-lg lg:sticky lg:top-24"
      >
        <div className="flex justify-between items-center cursor-pointer lg:cursor-default" onClick={toggleExpand}>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('priceBreakdown')}
          </h2>
          {/* desktop only; no chevron on mobile */}
        </div>

        <AnimatePresence>
          {isDesktopExpanded && (
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
                            const sel = typeof areaKey === 'string' ? { areaKey, method: 'print' } : areaKey;
                            const area = printAreas[sel.areaKey];
                            const feePerUnit = sel.method === 'print' ? (area?.fee || 0) : 10;
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
                        <span className="font-medium">+₪{pricing.breakdown.deliveryCost?.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">{t('total')}</span>
                        <span className="text-lg font-bold text-blue-600">₪{pricing.totalIls?.toLocaleString()}</span>
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

              <Button className="w-full" size="lg" disabled={!canAddToCart} onClick={() => { onAddToCart(); setAddedOnce(true); }}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                {t('addToCart')}
              </Button>

              {addedOnce && (
                <div className="mt-3">
                  <Link to="/catalog" className="w-full inline-block">
                    <button className="w-full bg-white border border-gray-200 rounded px-4 py-3 text-sm text-gray-700">
                      {language === 'he' ? 'בחר מוצר נוסף' : 'Choose another product'}
                    </button>
                  </Link>
                </div>
              )}

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

      {/* Mobile floating button + bottom sheet */}
      <div className="lg:hidden">
        <button
          aria-label="Open pricing"
          onClick={() => { lastFocusedRef.current = document.activeElement; setIsSheetOpen(true); }}
          className="fixed bottom-6 right-4 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg z-50"
        >
          {t('priceBreakdown')}
        </button>

        <AnimatePresence>
          {isSheetOpen && createPortal(
            <>
              {/* backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black z-[100]"
                onClick={() => setIsSheetOpen(false)}
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4 z-[110] overflow-auto max-h-[70vh] pb-[calc(env(safe-area-inset-bottom,0)+16px)]"
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('priceBreakdown')}
                onKeyDown={(e) => {
                  if (e.key !== 'Tab') return;
                  const focusable = sheetRef.current?.querySelectorAll('a,button,select,input,textarea,[tabindex]:not([tabindex="-1"])');
                  if (!focusable || !focusable.length) return;
                  const first = focusable[0];
                  const last = focusable[focusable.length - 1];
                  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }}
              >
                {/* handle removed to avoid stray small centered line appearing in header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{t('priceBreakdown')}</h3>
                  <button onClick={() => setIsSheetOpen(false)} aria-label="Close pricing" className="text-gray-600">✕</button>
                </div>
                <div className="space-y-4 mb-6 pt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('totalQuantity')}</span>
                    <span className="font-medium">{pricing.totalQty} {language === 'he' ? 'פריטים' : 'units'}</span>
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">{t('total')}</span>
                      <span className="text-lg font-bold text-blue-600">₪{pricing.totalIls?.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-2" size="lg" disabled={!canAddToCart} onClick={() => { onAddToCart(); setIsSheetOpen(false); setAddedOnce(true); }}>{t('addToCart')}</Button>
                  {addedOnce && (
                    <Link to="/catalog" onClick={() => setIsSheetOpen(false)}>
                      <button className="w-full mt-2 bg-white border border-gray-200 rounded px-4 py-3 text-sm text-gray-700">
                        {language === 'he' ? 'בחר מוצר נוסף' : 'Choose another product'}
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
            </>,
            document.body
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default PricePanel;