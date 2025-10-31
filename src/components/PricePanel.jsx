import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart.js';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle.js';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up.js';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.js';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import DiscountPopup from '@/components/DiscountPopup';

const PricePanel = ({ pricing, selectedAreas, canAddToCart, onAddToCart }) => {
  const { t, language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  // Desktop sidebar expanded (always true by default on desktop)
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  // Mobile bottom-sheet open state (default closed)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Whether the user has clicked Add to Cart at least once in this configurator session
  const [addedOnce, setAddedOnce] = useState(false);
  const sheetRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const lastScrollRef = useRef(0);
  // Desktop: sticky fallback via fixed positioning
  const desktopWrapperRef = useRef(null);
  const [forceFixed, setForceFixed] = useState(false);
  const [fixedStyle, setFixedStyle] = useState({});
  // State for discount popup
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);

  // Track scroll position only; do not lock overflow to avoid persistent disable/jump.
  useEffect(() => {
    if (isSheetOpen) {
      lastScrollRef.current = window.scrollY || window.pageYOffset || 0;
    }
    return () => {};
  }, [isSheetOpen]);

  // handle Escape key to close (mobile sheet only)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isSheetOpen) setIsSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);

    // prevent background scroll on mobile when sheet is open
    const preventScroll = (e) => {
      // allow scrolling within the sheet
      if (!sheetRef.current) return;
      if (sheetRef.current.contains(e.target)) return;
      e.preventDefault?.();
      e.stopPropagation?.();
      return false;
    };

    if (isSheetOpen) {
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
    };
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

  // Desktop sticky fallback: if native sticky fails (due to transform/stacking contexts), switch to fixed with computed left/width
  useEffect(() => {
    if (isMobile) {
      setForceFixed(false);
      return;
    }

    const getHeaderHeight = () => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '120px';
        const n = parseInt(v.toString().replace('px', '').trim(), 10);
        return Number.isFinite(n) ? n : 120;
      } catch {
        return 120;
      }
    };

    const update = () => {
      const el = desktopWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const headerH = getHeaderHeight();
      const threshold = headerH + 16; // 16px breathing room

      // When the wrapper's top scrolls above header, fix the inner panel.
      if (rect.top <= threshold) {
        setForceFixed(true);
        setFixedStyle({
          position: 'fixed',
          top: `${threshold}px`,
          left: `${Math.max(0, rect.left)}px`,
          width: `${rect.width}px`,
          zIndex: 1000
        });
      } else {
        setForceFixed(false);
        setFixedStyle({});
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isMobile]);

  const toggleExpand = () => {
    if (!isMobile) setIsDesktopExpanded((v) => !v);
  };

  // Helper: close sheet and restore scroll state
  const closeSheet = () => {
    setIsSheetOpen(false);
    // restore previous scroll position after next tick
    const y = lastScrollRef.current || 0;
    requestAnimationFrame(() => {
      try { window.scrollTo(0, y); } catch {}
    });
  };

  return (
    <>
      <div ref={desktopWrapperRef} className="hidden lg:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`price-panel p-6 bg-white rounded-xl shadow-lg ${forceFixed ? '' : 'lg:sticky'}`}
          style={forceFixed ? fixedStyle : { top: 'var(--header-height, 88px)' }}
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

              {/* Blank products are allowed; do not force selecting a print area. */}

              <Button
                className="w-full"
                size="lg"
                variant={addedOnce ? 'outline' : 'default'}
                disabled={!canAddToCart}
                onClick={() => { 
                  onAddToCart(); 
                  setAddedOnce(true);
                  setShowDiscountPopup(true);
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {t('addToCart')}
              </Button>

              {addedOnce && (
                <div className="mt-2">
                  <Link to="/catalog" className="w-full inline-block">
                    <button className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 leading-tight">
                      {language === 'he' ? 'בחר מוצר נוסף' : 'Choose another product'}
                    </button>
                  </Link>
                </div>
              )}

              {!canAddToCart && (
                <div className="mt-3 text-sm text-red-600 text-center">
                  {pricing.totalQty === 0 ? null : t('chooseColor')}
                </div>
              )}

              <div className="mt-3">
                <Link to="/cart" className="w-full inline-block">
                  <Button className="w-full" size="lg" variant={addedOnce ? 'default' : 'outline'}>
                    {language === 'he' ? 'עבור לעגלה' : 'Go to cart'}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>

      {/* Mobile sticky bottom bar + bottom sheet */}
      <div className="lg:hidden">
        {/* Spacer so content isn't covered by the fixed bottom bar (slightly taller to account for 2-row layout) */}
        <div className="h-[124px]" aria-hidden="true" />

        <div className="fixed inset-x-0 bottom-0 bg-white border-t shadow-[0_-6px_18px_rgba(0,0,0,0.08)] z-[1900]">
          <div className="max-w-7xl mx-auto px-3 py-2 pb-[calc(env(safe-area-inset-bottom,0)+8px)] flex flex-wrap items-start gap-3">
            {/* Left: concise multi-line summary */}
            <div className="flex-1 leading-tight min-w-0 basis-full space-y-1 text-sm">
              <div className="flex justify-between text-[14px] font-semibold">
                <span>{language === 'he' ? 'כמות' : 'Qty'}</span>
                <span>{pricing?.totalQty || 0}</span>
              </div>
              <div className="flex justify-between text-[13px] text-gray-700">
                <span>{language === 'he' ? 'מחיר בסיס' : 'Base'}</span>
                <span>₪{pricing?.breakdown?.unitBase || 0} × {pricing?.totalQty || 0}</span>
              </div>
              {selectedAreas.length > 0 && (
                <div className="flex justify-between text-[13px] text-gray-700">
                  <span>{language === 'he' ? 'עלויות מיתוג' : 'Placement'}</span>
                  <span>₪{pricing?.breakdown?.placementFeesTotal?.toLocaleString() || 0}</span>
                </div>
              )}
              {pricing?.breakdown?.emboFeeTotal > 0 && (
                <div className="flex justify-between text-[13px] text-gray-700">
                  <span>{language === 'he' ? 'דמי גלופה' : 'Embo fee'}</span>
                  <span>₪{pricing?.breakdown?.emboFeeTotal?.toLocaleString() || 0}</span>
                </div>
              )}
              {pricing?.breakdown?.deliveryCost > 0 && (
                <div className="flex justify-between text-[13px] text-gray-700">
                  <span>{language === 'he' ? 'משלוח' : 'Delivery'}</span>
                  <span>₪{pricing?.breakdown?.deliveryCost?.toLocaleString() || 0}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-bold pt-1 border-t">
                <span>{language === 'he' ? 'סה"כ' : 'Total'}</span>
                <span className="text-blue-600">₪{pricing?.totalIls?.toLocaleString() || 0}</span>
              </div>
            </div>

            {/* Right: actions - before add: two buttons in a row; after add: three buttons in a row */}
            <div className="basis-full w-full">
              {!addedOnce ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    disabled={!canAddToCart}
                    onClick={() => {
                      try { 
                        onAddToCart();
                        setAddedOnce(true);
                        setShowDiscountPopup(true);
                      } catch {}
                      try { toast({ title: t('addedToCart'), description: t('addToCartCount')(pricing.totalQty) }); } catch {}
                    }}
                    className="rounded-full w-full"
                  >
                    {t('addToCart')}
                  </Button>
                  <Link to="/cart" onClick={closeSheet} className="w-full">
                    <Button size="lg" variant="default" className="rounded-full w-full">
                      {language === 'he' ? 'לעגלה' : 'Cart'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="lg"
                    disabled={!canAddToCart}
                    onClick={() => {
                      try { 
                        onAddToCart();
                        setShowDiscountPopup(true);
                      } catch {}
                      try { toast({ title: t('addedToCart'), description: t('addToCartCount')(pricing.totalQty) }); } catch {}
                    }}
                    className="rounded-full w-full"
                  >
                    {t('addToCart')}
                  </Button>

                  <Link to="/cart" onClick={closeSheet} className="w-full">
                    <Button size="lg" variant="default" className="rounded-full w-full">
                      {language === 'he' ? 'לעגלה' : 'Cart'}
                    </Button>
                  </Link>

                  <Link to="/catalog" onClick={closeSheet} className="w-full">
                    <Button size="lg" variant="outline" className="rounded-full w-full py-2 text-xs leading-tight">
                      {language === 'he' ? 'בחר מוצר נוסף' : 'Choose another product'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSheetOpen && createPortal(
            <>
              {/* backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black z-[2000]"
                onClick={closeSheet}
              />

              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4 z-[2100] overflow-auto max-h-[70vh] pb-[calc(env(safe-area-inset-bottom,0)+16px)]"
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
                  <button onClick={closeSheet} aria-label="Close pricing" className="text-gray-600">✕</button>
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
                  <Button
                    className="w-full mt-2"
                    size="lg"
                    variant={addedOnce ? 'outline' : 'default'}
                    disabled={!canAddToCart}
                    onClick={() => { 
                      onAddToCart(); 
                      closeSheet(); 
                      setAddedOnce(true);
                      setShowDiscountPopup(true);
                    }}
                  >
                    {t('addToCart')}
                  </Button>
                  {addedOnce && (
                    <>
                      <Link to="/cart" onClick={closeSheet}>
                        <Button className="w-full mt-2" size="lg" variant="default">
                          {language === 'he' ? 'עבור לעגלה' : 'Go to cart'}
                        </Button>
                      </Link>
                      <Link to="/catalog" onClick={closeSheet}>
                        <Button className="w-full mt-2 text-xs leading-tight" size="lg" variant="outline">
                          {language === 'he' ? 'בחר מוצר נוסף' : 'Choose another product'}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </>,
            document.body
          )}
        </AnimatePresence>
      </div>

      {/* Discount popup */}
      <DiscountPopup open={showDiscountPopup} onOpenChange={setShowDiscountPopup} />
    </>
  );
};

export default PricePanel;