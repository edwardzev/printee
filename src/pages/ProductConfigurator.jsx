import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { products, printAreas, pricingRules, colorLabelsHe } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SizeMatrix from '@/components/SizeMatrix';
import PrintAreaSelector from '@/components/PrintAreaSelector';
import MockupCanvas from '@/components/MockupCanvas';
import PricePanel from '@/components/PricePanel';

const ProductConfigurator = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToCart, updateCartItem } = useCart();
  const { toast } = useToast();
  const location = useLocation();

  const product = products.find(p => p.sku === sku);
  
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeMatrix, setSizeMatrix] = useState({});
  // selectedPrintAreas is an array of { areaKey, method } where method is 'print' or 'embo'
  const [selectedPrintAreas, setSelectedPrintAreas] = useState([]);
  const [uploadedDesigns, setUploadedDesigns] = useState({});
  const [withDelivery, setWithDelivery] = useState(false);

  // New segmented toggle (pickup/delivery) – keep in sync with legacy withDelivery boolean
  const [deliveryMode, setDeliveryMode] = useState(withDelivery ? 'delivery' : 'pickup');
  useEffect(() => {
    setWithDelivery(deliveryMode === 'delivery');
  }, [deliveryMode]);
  useEffect(() => {
    setDeliveryMode(withDelivery ? 'delivery' : 'pickup');
  }, [withDelivery]);

  useEffect(() => {
    if (product && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  // Initialize from prefill (navigated from Cart -> Edit)
  useEffect(() => {
    const prefill = location?.state?.prefill;
    if (prefill && prefill.productSku === sku) {
      if (prefill.color) setSelectedColor(prefill.color);
      if (prefill.sizeMatrix) setSizeMatrix(prefill.sizeMatrix);
      // support legacy prefill format (array of keys) and new format (array of objects)
      if (prefill.selectedPrintAreas) {
        const s = prefill.selectedPrintAreas;
        if (Array.isArray(s) && s.length && typeof s[0] === 'string') {
          setSelectedPrintAreas(s.map(k => ({ areaKey: k, method: 'print' })));
        } else {
          setSelectedPrintAreas(s);
        }
      }
      if (prefill.uploadedDesigns) setUploadedDesigns(prefill.uploadedDesigns);
      if (typeof prefill.withDelivery === 'boolean') setWithDelivery(prefill.withDelivery);
    }
  }, [location, sku]);

  // Helper to pick first src from an array or return string as-is
  const pickSrc = (maybeArrayOrString, fallback) => {
    if (!maybeArrayOrString) return fallback || '';
    if (Array.isArray(maybeArrayOrString)) return maybeArrayOrString[0] || fallback || '';
    return maybeArrayOrString;
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => navigate('/catalog')}>
            Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const EMBO_DEV_FEE = 200; // גלופה one-time per cart item if any embo chosen
  const EMBO_UNIT_FEE = 10; // per-unit fee for embo small areas

  const calculatePrice = () => {
    const totalQty = Object.values(sizeMatrix).reduce((sum, qty) => sum + (qty || 0), 0);

    if (totalQty === 0) return { totalQty: 0, breakdown: {}, totalIls: 0 };

    const rules = pricingRules[product.sku];
    const tier = rules.tiers.find(t => totalQty >= t.min && totalQty <= t.max);
    const unitPrice = tier ? tier.price : rules.tiers[rules.tiers.length - 1].price;

    const baseTotal = unitPrice * totalQty;

    // placement and embo fees
    let placementFeesTotal = 0;
    let emboUnitsCount = 0;
    selectedPrintAreas.forEach(sel => {
      const areaKey = sel.areaKey || sel;
      const method = sel.method || 'print';
      const area = printAreas[areaKey];
      if (!area) return;
      if (method === 'print') {
        placementFeesTotal += (area.fee || 0) * totalQty;
      } else if (method === 'embo') {
        emboUnitsCount += 1; // count small areas; embo per-area per-unit fee applies
      }
    });

    const emboFeeTotal = emboUnitsCount > 0 ? (EMBO_DEV_FEE + (EMBO_UNIT_FEE * totalQty * emboUnitsCount)) : 0;

    const deliveryCost = withDelivery ? Math.ceil(totalQty / 50) * 50 : 0;

    const grandTotal = baseTotal + placementFeesTotal + emboFeeTotal + deliveryCost;

    return {
      totalQty,
      breakdown: {
        unitBase: unitPrice,
        baseTotal,
        placementFeesPerUnit: selectedPrintAreas.reduce((sum, sel) => {
          const areaKey = sel.areaKey || sel;
          const method = sel.method || 'print';
          const area = printAreas[areaKey];
          if (!area) return sum;
          return sum + (method === 'print' ? (area.fee || 0) : 0);
        }, 0),
        placementFeesTotal,
        emboUnitsCount,
        emboFeeTotal,
        deliveryCost,
        grandTotal
      },
      totalIls: grandTotal
    };
  };

  const handleFileUpload = (areaKey, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedDesigns(prev => ({
        ...prev,
        [areaKey]: {
          file,
          url: e.target.result,
          name: file.name
        }
      }));
      // upload success toast removed per UX request — preview is visible so no toast needed
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const pricing = calculatePrice();
    
    if (selectedPrintAreas.length === 0) {
      toast({
        title: t('selectPrintArea'),
        variant: 'destructive'
      });
      return;
    }

    const cartItem = {
      productSku: product.sku,
      productName: language === 'he' ? product.nameHe : product.name,
      color: selectedColor,
      sizeMatrix,
      // store the selected areas with methods
      selectedPrintAreas,
      uploadedDesigns,
      withDelivery,
      totalPrice: pricing.totalIls,
      priceBreakdown: pricing.breakdown,
      mockupUrl: pickSrc(product.images[selectedColor], product.images.base1)
    };

    const prefillId = location?.state?.prefill?.id;
    if (prefillId) {
      updateCartItem(prefillId, { ...cartItem });
      toast({
        title: t('addedToCart'),
        description: t('updateCartCount')(pricing.totalQty)
      });
      // remove prefill from history to avoid accidental re-edit on reload
      navigate(window.location.pathname, { replace: true, state: {} });
    } else {
      addToCart(cartItem);
      toast({
        title: t('addedToCart'),
        description: t('addToCartCount')(pricing.totalQty)
      });
    }
  };
  // Helper to resolve product description with fallbacks and trims
  const getProductDescription = (product, language) => {
    if (!product) return '';
    const primary = language === 'he' ? product?.descriptionHe : product?.description;
    if (typeof primary === 'string' && primary.trim().length > 0) return primary.trim();
    const other = product?.descriptionHe || product?.description;
    if (typeof other === 'string' && other.trim().length > 0) return other.trim();
    return '';
  };

  const desc = getProductDescription(product, language);

  const pricing = calculatePrice();
  const canAddToCart = selectedPrintAreas.length > 0;

  return (
    <>
      <Helmet>
        <title>{language === 'he' ? product.nameHe : product.name} – Printee</title>
        <meta name="description" content={`Customize your ${product.name} with our design tool`} />
      </Helmet>

      <div className="min-h-screen py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 pb-8 lg:pb-48">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {language === 'he' ? product.nameHe : product.name}
                </h1>
                {/* Always render description if resolved */}
                {desc ? (
                  <p className="text-gray-600 leading-relaxed mt-1 whitespace-pre-line">
                    {desc}
                  </p>
                ) : null}
                {/* end description area */}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  1. {t('chooseColor')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative aspect-square rounded-lg border-4 transition-all ${
                        selectedColor === color
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={pickSrc(product.images[color], product.images.base1)}
                        alt={`${language === 'he' ? product.nameHe : product.name} ${color}`}
                        className="w-full h-full object-contain rounded-md"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const el = e.currentTarget;
                          // if src list provided, try next fallback
                          const list = Array.isArray(product.images[color]) ? product.images[color] : null;
                          if (list) {
                            const idx = list.indexOf(el.src);
                            if (idx >= 0 && idx < list.length - 1) {
                              el.src = list[idx + 1];
                              return;
                            }
                          }
                          // generic extension fallback
                          if (el.src.endsWith('.webp')) el.src = el.src.replace('.webp', '.jpg');
                          else if (el.src.endsWith('.jpg')) el.src = el.src.replace('.jpg', '.jpeg');
                          else if (el.src.endsWith('.jpeg')) el.src = el.src.replace('.jpeg', '.png');
                        }}
                      />
                      <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-xs font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded capitalize">
                          {language === 'he' ? (colorLabelsHe[color] || color) : color}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. {t('sizeMatrix')}
                </h2>
                <SizeMatrix
                  sizeRange={product.sizeRange}
                  sizeMatrix={sizeMatrix}
                  onChange={setSizeMatrix}
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('totalQuantity')}: {pricing.totalQty}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. {t('printAreas')}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{language === 'he' ? 'שיטת מיתוג' : 'Branding method'}</p>
                <PrintAreaSelector
                  availableAreas={product.activePrintAreas}
                  selectedAreas={selectedPrintAreas}
                  onChange={setSelectedPrintAreas}
                />
              </motion.div>

              {selectedPrintAreas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    4. {t('uploadDesign')}
                  </h2>
                  <div className="space-y-6">
                    {selectedPrintAreas.map((sel) => {
                      const areaKey = typeof sel === 'string' ? sel : sel.areaKey;
                      const area = printAreas[areaKey];
                      const method = typeof sel === 'string' ? 'print' : sel.method || 'print';
                      return (
                        <div key={areaKey} className="border rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-3">
                            {language === 'he' ? area?.labelHe : area?.label} {method === 'embo' ? `• ${language === 'he' ? 'רקמה' : 'Embo'}` : ''}
                          </h3>
                          <MockupCanvas
                            areaKey={areaKey}
                            baseImage={`/schematics/${areaKey.startsWith('back') ? 'back' : 'front'}.png`}
                            onFileUpload={(file) => handleFileUpload(areaKey, file)}
                            uploadedDesign={uploadedDesigns[areaKey]}
                          />
                        </div>
                      );
                    })}
                    {/* If editing and uploadedDesigns are empty for an area, show notice */}
                    {location?.state?.prefill && Object.keys(uploadedDesigns || {}).length === 0 && (
                      <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                        {language === 'he' ? 'שים לב: קבצי העיצוב לא נשמרו בעגלת הקניות; יש להעלות אותם שוב לפני הוספה לעגלה.' : 'Note: design files were not preserved in the cart; please re-upload them.'}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  5. {language === 'he' ? 'משלוח / איסוף' : 'Delivery / Pickup'}
                </h2>

                {/* Segmented toggle */}
                <div className="inline-flex items-center gap-1 p-1 mb-4 rounded-full bg-gray-100">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('pickup')}
                    aria-pressed={deliveryMode === 'pickup'}
                    className={
                      'px-4 py-2 rounded-full text-sm transition shadow-sm ' +
                      (deliveryMode === 'pickup'
                        ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow'
                        : 'bg-white text-gray-700 hover:text-gray-900')
                    }
                  >
                    {language === 'he' ? 'איסוף עצמי' : 'Pick up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('delivery')}
                    aria-pressed={deliveryMode === 'delivery'}
                    className={
                      'px-4 py-2 rounded-full text-sm transition shadow-sm ' +
                      (deliveryMode === 'delivery'
                        ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow'
                        : 'bg-white text-gray-700 hover:text-gray-900')
                    }
                  >
                    {language === 'he' ? 'משלוח' : 'Delivery'}
                  </button>
                </div>

                {deliveryMode === 'pickup' ? (
                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {language === 'he'
                        ? 'איסוף מהמפעל: האורגים 32, חולון (א׳–ה׳ 10:00–18:00)'
                        : 'Pickup at studio: 12 Allenby St, Tel Aviv (Sun–Thu 10:00–18:00)'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        {language === 'he' ? 'שם מלא' : 'Full name'}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={language === 'he' ? 'שם מלא' : 'Full name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        {language === 'he' ? 'טלפון' : 'Phone'}
                      </label>
                      <input
                        type="tel"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="05x-xxxxxxx"
                      />
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">
                          {language === 'he' ? 'רחוב ומס בית' : 'Street'}
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={language === 'he' ? 'שם הרחוב ומס בית' : 'Street name'}
                        />
                      </div>
                    
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        {language === 'he' ? 'עיר' : 'City'}
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={language === 'he' ? 'עיר' : 'City'}
                      />
                    </div>
                    <div className="sm:col-span-2 mt-2 text-sm text-gray-600">
                      {t('deliveryPriceInfo')}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <PricePanel
                pricing={pricing}
                selectedAreas={selectedPrintAreas}
                canAddToCart={canAddToCart}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductConfigurator;