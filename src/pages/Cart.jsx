import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js';
import Edit from 'lucide-react/dist/esm/icons/edit-2.js';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.js';
import { products, printAreas, colorLabelsHe } from '@/data/products';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CheckoutModal from '@/components/CheckoutModal';
import DeliveryOptions from '@/components/DeliveryOptions';
import { deriveDiscountedPricing, DEFAULT_DISCOUNT_RATE } from '@/lib/discountHelpers';
const Cart = () => {
  const { t, language } = useLanguage();
  const { cartItems, removeFromCart, payload, mergePayload, getTotalItems } = useCart();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const discountClaimed = (() => {
    if (payload?.discountClaimed) return true;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem('printee:discount-claimed') === 'true';
      }
    } catch (err) {
      // ignore storage access failures
    }
    return false;
  })();

  const currencyFormatter = useMemo(() => {
    const locale = language === 'he' ? 'he-IL' : 'en-IL';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch {
      return new Intl.NumberFormat('en-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }, [language]);

  const formatCurrency = useCallback((value) => {
    const num = Number(value);
    const safe = Number.isFinite(num) ? num : 0;
    try {
      return currencyFormatter.format(safe);
    } catch {
      return `₪${safe.toFixed(2)}`;
    }
  }, [currencyFormatter]);

  const derivedItems = useMemo(() => {
    return (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
      item,
      ...deriveDiscountedPricing(item, { discountClaimed, defaultRate: DEFAULT_DISCOUNT_RATE }),
    }));
  }, [cartItems, discountClaimed]);

  const aggregateTotals = useMemo(() => {
    return derivedItems.reduce((acc, entry) => {
      acc.totalBeforeDiscount += entry.subtotalBefore;
      acc.discountTotal += entry.discountAmount;
      acc.subtotalAfterDiscount += entry.subtotalAfter;
      return acc;
    }, { totalBeforeDiscount: 0, discountTotal: 0, subtotalAfterDiscount: 0 });
  }, [derivedItems]);

  const { totalBeforeDiscount, discountTotal, subtotalAfterDiscount } = aggregateTotals;
  const totalItems = typeof getTotalItems === 'function' ? getTotalItems() : 0;
  const deliveryCost = payload?.withDelivery ? Math.ceil(totalItems / 50) * 50 : 0;
  const vatBase = subtotalAfterDiscount + deliveryCost;
  const vatAmount = Math.round(vatBase * 0.17);
  const grandTotal = Math.round(vatBase * 1.17);

  const firstDiscountedItem = derivedItems.find((entry) => entry.discountAmount > 0);
  const discountRatePercent = firstDiscountedItem
    ? Math.round(((firstDiscountedItem.discountRate || DEFAULT_DISCOUNT_RATE) || 0) * 100)
    : Math.round(DEFAULT_DISCOUNT_RATE * 100);
  const discountLabelValue = t('discountLabel');
  const discountLabelText = typeof discountLabelValue === 'function'
    ? discountLabelValue(discountRatePercent)
    : discountLabelValue;

  const handleCheckout = () => {
    // Ensure we have an idempotency key before opening the modal
    let idem = payload?.idempotency_key;
    if (!idem) {
      idem = `ord-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      try { mergePayload({ idempotency_key: idem }); } catch {}
    }

    // Build uploads list from cart items: for each uploaded design (per print area)
    // create an entry per active color with its quantity.
    const uploads = (() => {
      try {
        const list = [];
        (cartItems || []).forEach((item) => {
          const product = item.productSku || item.product || 'product';
          const matrices = item.sizeMatrices || {};
          // Determine active colors and their total qty
          let colors = item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length
            ? item.selectedColors
            : (item.color ? [item.color] : []);
          if (colors.length === 0) return; // nothing to upload without a color context

          // Reduce to active colors with qty > 0, and compute total qty for all colors
          const activeColors = [];
          let totalQtyForItem = 0;
          colors.forEach((c) => {
            const mat = (matrices && matrices[c]) || (c === item.color ? (item.sizeMatrix || {}) : {});
            const qty = Object.values(mat || {}).reduce((s, q) => s + (q || 0), 0);
            if (qty > 0) {
              activeColors.push(c);
              totalQtyForItem += qty;
            }
          });
          if (activeColors.length === 0) return;

          // Map areaKey -> method
          const areaMethod = {};
          (item.selectedPrintAreas || []).forEach((sel) => {
            if (!sel) return;
            if (typeof sel === 'string') areaMethod[sel] = 'print';
            else if (sel.areaKey) areaMethod[sel.areaKey] = sel.method || 'print';
          });

          const designs = item.uploadedDesigns || {};
          Object.keys(designs).forEach((areaKey) => {
            const d = designs[areaKey];
            if (!d || !d.url) return;
            const method = areaMethod[areaKey] || 'print';
            const fileName = d.name || `${areaKey}.png`;
            // Prefer originalUrl (PDF) if present; fallback to preview url
            const dataUrl = (d.originalUrl && typeof d.originalUrl === 'string') ? d.originalUrl : d.url;
            // Single combined upload per area: include all active colors and the total qty
            list.push({
              areaKey,
              method,
              product,
              colors: activeColors,
              qty: totalQtyForItem,
              dataUrl,
              fileName,
            });
          });
        });
        return list;
      } catch (e) {
        return [];
      }
    })();

    // Create/ensure a draft order in Airtable and upload any user-provided design files.
    try {
      const body = JSON.stringify({ idempotency_key: idem, uploads });
      // Note: do NOT use keepalive for potentially large payloads (browsers limit to ~64KB).
      // Fire-and-forget; we don't await before opening modal.
      fetch('/api/airtable/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {});
    } catch (_) {}

    setModalOpen(true);
  };

  // Always scroll to top on mount so user starts at the top of the cart page
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch { window.scrollTo(0, 0); }
  }, []);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    toast({
      title: 'הפריט הוסר מהעגלה'
    });
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
    <title>{t('cartTitle')} - Printeam</title>
    <link rel="canonical" href="https://printeam.co.il/cart" />
          <meta name="description" content="Your shopping cart" />
        </Helmet>

        <div className="min-h-screen py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('cartEmpty')}
                </h1>
                <p className="text-gray-600 mb-8">
                  התחל בתהליך הזמנה עכשיו!
                </p>
                <Link to="/catalog">
                  <Button size="lg">
                    {t('continueShopping')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
  <title>{t('cartTitle')} - Printeam</title>
        <meta name="description" content="Review your custom apparel orders" />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('cartTitle')}
            </h1>
            <p className="text-gray-600">
              סקור את הפריטים בעגלתך והמשך לתשלום
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={(() => {
                          try {
                            const prod = products.find(p => p.sku === item.productSku);
                            const color = item.color || (prod && prod.colors && prod.colors[0]);
                            const list = prod && prod.images && prod.images[color];
                            if (Array.isArray(list) && list.length) {
                              const prefer = list.find(p => p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png'));
                              return prefer || list[0];
                            }
                            const baseList = prod && prod.images && prod.images.base1;
                            if (Array.isArray(baseList) && baseList.length) {
                              const preferBase = baseList.find(p => p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png'));
                              return preferBase || baseList[0];
                            }
                          } catch (e) {}
                          return item.mockupUrl;
                        })()}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          const el = e.currentTarget;
                          try {
                            const prod = products.find(p => p.sku === item.productSku);
                            const color = item.color || (prod && prod.colors && prod.colors[0]);
                            const list = prod && prod.images && prod.images[color];
                            if (Array.isArray(list) && list.length) {
                              // find current index by matching end of path using pathname
                              try {
                                const pathname = new URL(el.src, window.location.origin).pathname;
                                let idx = list.findIndex(path => pathname.endsWith(path));
                                if (idx === -1) idx = 0;
                                if (idx >= 0 && idx < list.length - 1) {
                                  el.src = list[idx + 1];
                                  return;
                                }
                              } catch (err) {
                                // fallback to string matching
                                let idx = list.findIndex(path => el.src.endsWith(path));
                                if (idx === -1) idx = 0;
                                if (idx >= 0 && idx < list.length - 1) {
                                  el.src = list[idx + 1];
                                  return;
                                }
                              }
                            }
                          } catch (err) {
                            // ignore
                          }
                          if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.jpg');
                          else if (el.src.endsWith('.jpg')) el.src = el.src.replace('.jpg', '.jpeg');
                          else if (el.src.endsWith('.jpeg')) el.src = el.src.replace('.jpeg', '.png');
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.productName}
                      </h3>
                      {/* Compact color x size table: rows = colors, cols = sizes */}
                      {(() => {
                        const matrices = item.sizeMatrices || {};
                        const activeColors = (item.selectedColors || []).filter(c => {
                          const mat = matrices[c] || {};
                          return Object.values(mat).reduce((s, q) => s + (q || 0), 0) > 0;
                        });

                        if (activeColors.length > 0) {
                          // Prefer the product's canonical sizeRange so columns are uniform
                          const prod = products.find(p => p.sku === item.productSku) || {};
                          let sizes = Array.isArray(prod.sizeRange) && prod.sizeRange.length
                            ? prod.sizeRange.slice()
                            : null;

                          // If product doesn't declare sizes, fall back to collecting sizes from matrices
                          if (!sizes) {
                            const sizesSet = new Set();
                            activeColors.forEach(c => {
                              const mat = matrices[c] || {};
                              Object.keys(mat || {}).forEach(sz => sizesSet.add(sz));
                            });
                            sizes = Array.from(sizesSet);
                          }

                          return (
                            <div className="overflow-auto mb-2">
                              <table className="w-full text-sm text-gray-700 border-collapse">
                                <thead>
                                  <tr>
                                    <th className="text-left pr-4 pb-2 font-medium">{language === 'he' ? 'צבע' : 'Color'}</th>
                                    {sizes.map((sz, i) => (
                                      <th
                                        key={sz}
                                        className={`text-center px-3 pb-2 font-medium border-l border-gray-200`}
                                      >
                                        {t(sz) || sz.toUpperCase()}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeColors.map(colorKey => {
                                    const mat = matrices[colorKey] || {};
                                    return (
                                      <tr key={colorKey} className="border-t">
                                        <td className="py-2 pr-4">{language === 'he' ? (colorLabelsHe[colorKey] || colorKey) : colorKey}</td>
                                        {sizes.map((sz) => {
                                          const qty = mat[sz] || 0;
                                          return (
                                            <td key={sz} className={`text-center px-3 py-2 border-l border-gray-200`}>
                                              {qty > 0 ? qty : ''}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        // Legacy single-color fallback (list sizes)
                        return (
                          <div className="text-sm text-gray-500 mb-2">
                            {Object.entries(item.sizeMatrix || {})
                              .filter(([size, qty]) => qty > 0)
                              .map(([size, qty]) => `${t(size) || size.toUpperCase()}: ${qty}`)
                              .join(', ')}
                          </div>
                        );
                      })()}

                      {/* Print areas */}
                      <div className="text-sm text-gray-500 mb-3">
                        אזורי הדפסה: {item.selectedPrintAreas.map(s => {
                          const sel = typeof s === 'string' ? { areaKey: s, method: 'print' } : s;
                          const area = printAreas[sel.areaKey];
                          const methodLabel = sel.method === 'embo' ? (language === 'he' ? 'רקמה' : 'Embo') : (language === 'he' ? 'הדפסה' : 'Print');
                          return `${area?.labelHe || area?.label || sel.areaKey} (${methodLabel})`;
                        }).join(', ')}
                      </div>

                      {(() => {
                        const toNumber = (val) => {
                          const num = Number(val);
                          return Number.isFinite(num) ? num : 0;
                        };
                        const derived = derivedItems[index];
                        const itemDiscountAmount = derived?.discountAmount ?? toNumber(item.discountAmount);
                        const itemTotal = derived?.subtotalAfter ?? toNumber(item.totalPrice);
                        const itemDiscountRate = derived?.discountRate ?? toNumber(item.discountRate);
                        const itemDiscountLabel = typeof discountLabelValue === 'function'
                          ? discountLabelValue(Math.round(((itemDiscountRate || DEFAULT_DISCOUNT_RATE) || 0) * 100))
                          : discountLabelValue;

                        return (
                          <div className={`flex justify-between gap-4 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
                            <div className={`space-y-1 ${language === 'he' ? 'text-right' : 'text-left'}`}>
                              {itemDiscountAmount > 0 && (
                                <div className="text-sm text-green-600">
                                  {itemDiscountLabel}: -{formatCurrency(itemDiscountAmount)}
                                </div>
                              )}
                              <div className="text-lg font-semibold text-blue-600">
                                {t('total')}: {formatCurrency(itemTotal)}
                              </div>
                            </div>

                            <div className={`flex gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/product/${item.productSku}`, { state: { prefill: item } })}
                              >
                                <Edit className={`h-4 w-4 ${language === 'he' ? 'ml-1' : 'mr-1'}`} />
                                {t('editItem')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className={`h-4 w-4 ${language === 'he' ? 'ml-1' : 'mr-1'}`} />
                                {t('removeItem')}
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
                ))}

              {/* Delivery options: moved into cart body above upsell */}
              <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                <DeliveryOptions
            totalQty={totalItems}
                  withDelivery={payload?.withDelivery || false}
                  onDeliveryChange={(v)=>{ mergePayload({ withDelivery: !!v }); }}
                  contact={payload?.contact || {}}
                  onContactChange={(c) => { mergePayload({ contact: c }); }}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg sticky top-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  סיכום הזמנה
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('subtotalBeforeDiscount')}</span>
                    <span className="font-medium">{formatCurrency(totalBeforeDiscount)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{discountLabelText}</span>
                      <span>-{formatCurrency(discountTotal)}</span>
                    </div>
                  )}
                  {deliveryCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'he' ? 'עלות משלוח' : 'Delivery cost'}</span>
                      <span className="font-medium">+{formatCurrency(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('vatLabel')}</span>
                    <span className="font-medium">{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">{language === 'he' ? 'סה"כ' : 'Total'}</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mb-4" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  {language === 'he' ? 'המשך לתשלום' : t('checkout')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                {(() => {
                  const prefill = {
                    ...(payload?.contact || {}),
                    // If delivery contact exists, prefer its name/phone as prefill fallbacks
                    name: (payload?.contact?.name || payload?.contact?.fullName || ''),
                    phone: (payload?.contact?.phone || ''),
                    email: (payload?.contact?.email || ''),
                  };
                  return (
                    <CheckoutModal
                      open={modalOpen}
                      onClose={()=>setModalOpen(false)}
                      cartSummary={{
                        subtotal: totalBeforeDiscount,
                        discount: discountTotal,
                        total: subtotalAfterDiscount
                      }}
                      prefillContact={prefill}
                    />
                  );
                })()}

                <Link to="/catalog">
                  <Button variant="outline" className="w-full">
                    {language === 'he' ? 'המשך קניות' : t('continueShopping')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Upsell area: show other products - moved below the main grid so on mobile it appears at the bottom */}
          <div className="bg-white rounded-xl p-6 shadow-lg mt-6">
            <h3 className="text-lg font-semibold mb-4">עוד מוצרים שאולי יעניינו אותך</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.filter(p => !cartItems.some(ci => ci.productSku === p.sku)).slice(0,4).map(p => (
                <Link key={p.sku} to={`/product/${p.sku}`} className="flex flex-col items-center gap-2 p-3 border rounded">
                  <img
                    src={(Array.isArray(p.images?.base1) ? (p.images.base1.find(x=>x.endsWith('.jpg')||x.endsWith('.jpeg')||x.endsWith('.png'))||p.images.base1[0]) : `/product_images/${p.sku}/base1_${p.sku}.png`)}
                    alt={p.nameHe}
                    className="h-20 w-20 object-contain"
                    onError={(e) => {
                      const el = e.currentTarget;
                      try {
                        const list = Array.isArray(p.images?.base1) ? p.images.base1 : null;
                        if (list && list.length) {
                          try {
                            const pathname = new URL(el.src, window.location.origin).pathname;
                            let idx = list.findIndex(path => pathname.endsWith(path));
                            if (idx === -1) idx = 0;
                            if (idx >= 0 && idx < list.length - 1) {
                              el.src = list[idx + 1];
                              return;
                            }
                          } catch (err) {
                            let idx = list.findIndex(path => el.src.endsWith(path));
                            if (idx === -1) idx = 0;
                            if (idx >= 0 && idx < list.length - 1) {
                              el.src = list[idx + 1];
                              return;
                            }
                          }
                        }
                      } catch (err) {}
                      if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.jpg');
                      else if (el.src.endsWith('.jpg')) el.src = el.src.replace('.jpg', '.jpeg');
                      else if (el.src.endsWith('.jpeg')) el.src = el.src.replace('.jpeg', '.png');
                    }}
                  />
                  <div className="text-sm font-medium">{p.nameHe}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;