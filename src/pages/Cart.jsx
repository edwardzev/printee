import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShoppingBag, Trash2, Edit, ArrowRight } from 'lucide-react';
import { products, printAreas, colorLabelsHe } from '@/data/products';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CheckoutModal from '@/components/CheckoutModal';
import DeliveryOptions from '@/components/DeliveryOptions';

const Cart = () => {
  const { t, language } = useLanguage();
  const { cartItems, removeFromCart, getTotalPrice, payload, mergePayload, getTotalItems } = useCart();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Ensure we have an idempotency key before opening the modal
    let idem = payload?.idempotency_key;
    if (!idem) {
      idem = `ord-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      try { mergePayload({ idempotency_key: idem }); } catch {}
    }

    // Create/ensure a draft order in Airtable using only the idempotency key (no PII)
    try {
      const body = JSON.stringify({ idempotency_key: idem });
      let beaconsent = false;
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' });
        beaconsent = navigator.sendBeacon('/api/airtable/order', blob);
      }
      if (!beaconsent) {
        fetch('/api/airtable/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
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
          <title>{t('cartTitle')} - Print Market</title>
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
        <title>{t('cartTitle')} - Print Market</title>
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

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-600">
                          ₪{item.totalPrice.toLocaleString()}
                        </span>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/product/${item.productSku}`, { state: { prefill: item } })}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t('editItem')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t('removeItem')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                ))}

              {/* Delivery options: moved into cart body above upsell */}
              <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                <DeliveryOptions
                  totalQty={getTotalItems()}
                  withDelivery={payload?.withDelivery || false}
                  onDeliveryChange={(v)=>{ mergePayload({ withDelivery: !!v }); }}
                  contact={payload?.contact || {}}
                  onContactChange={(c) => { mergePayload({ contact: c }); }}
                />
              </div>

              {/* Upsell area: show other products */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">עוד מוצרים שאולי יעניינו אותך</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.filter(p => !cartItems.some(ci => ci.productSku === p.sku)).slice(0,4).map(p => (
                    <Link key={p.sku} to={`/product/${p.sku}`} className="flex flex-col items-center gap-2 p-3 border rounded">
                      <img
                        src={(Array.isArray(p.images?.base1) ? (p.images.base1.find(x=>x.endsWith('.jpg')||x.endsWith('.jpeg')||x.endsWith('.png'))||p.images.base1[0]) : `/product_images/${p.sku}/base_1.webp`)}
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
                    <span className="text-gray-600">סכום ביניים</span>
                    <span className="font-medium">₪{getTotalPrice().toLocaleString()}</span>
                  </div>
                  {payload?.withDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'he' ? 'עלות משלוח' : 'Delivery cost'}</span>
                      <span className="font-medium">₪{(Math.ceil(getTotalItems() / 50) * 50).toLocaleString()}</span>
                    </div>
                  )}
                  {/* delivery block removed from summary (rendered above upsell in main column) */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">מע"מ (17%)</span>
                    <span className="font-medium">₪{Math.round((getTotalPrice() + (payload?.withDelivery ? (Math.ceil(getTotalItems() / 50) * 50) : 0)) * 0.17).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">סה"כ</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₪{Math.round((getTotalPrice() + (payload?.withDelivery ? (Math.ceil(getTotalItems() / 50) * 50) : 0)) * 1.17).toLocaleString()}
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
                      cartSummary={{ total: getTotalPrice() }}
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
        </div>
      </div>
    </>
  );
};

export default Cart;