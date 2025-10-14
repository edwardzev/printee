import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShoppingCart, AlertCircle, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { products, printAreas, pricingRules, colorLabelsHe } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SizeMatrix from '@/components/SizeMatrix';
import PricingTiers from '@/components/PricingTiers';
import { useMediaQuery } from '@/hooks/use-media-query';
import PrintAreaSelector from '@/components/PrintAreaSelector';
import MockupCanvas from '@/components/MockupCanvas';
import PricePanel from '@/components/PricePanel';

const ProductConfigurator = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToCart, updateCartItem, mergePayload, payload } = useCart();
  const { toast } = useToast();
  const location = useLocation();

  const product = products.find(p => p.sku === sku);
  
  // support multiple selected colors: array of color keys
  const [selectedColors, setSelectedColors] = useState([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  // sizeMatrices maps color -> { size: qty }
  const [sizeMatrices, setSizeMatrices] = useState({});
  // selectedPrintAreas is an array of { areaKey, method } where method is 'print' or 'embo'
  const [selectedPrintAreas, setSelectedPrintAreas] = useState([]);
  const [uploadedDesigns, setUploadedDesigns] = useState({});

  // Do not preselect any color; user must actively choose

  // Persist selected colors to shared payload when they change
  useEffect(() => {
    if (selectedColors && selectedColors.length > 0) {
      try {
        mergePayload({ productSku: sku, selectedColors, sizeMatrices });
      } catch (err) {
        // ignore
      }
    }
  }, [selectedColors, sizeMatrices, sku, mergePayload]);

  // Initialize from prefill (navigated from Cart -> Edit)
  useEffect(() => {
    const prefill = location?.state?.prefill;
    if (prefill && prefill.productSku === sku) {
      // Support legacy single-color prefill and new multi-color format
      if (prefill.color) setSelectedColors([prefill.color]);
      if (prefill.sizeMatrix) setSizeMatrices(prev => ({
        ...(prev || {}),
        [prefill.color || product?.colors?.[0]]: prefill.sizeMatrix
      }));
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
    }
  }, [location, sku]);

  // Persist sizeMatrices as user edits sizes per color
  useEffect(() => {
    try {
      mergePayload({ sizeMatrices });
    } catch (err) {}
  }, [sizeMatrices, mergePayload]);

  // Persist selected print areas
  useEffect(() => {
    try {
      mergePayload({ selectedPrintAreas });
    } catch (err) {}
  }, [selectedPrintAreas, mergePayload]);

  // per-area comments/printColor are persisted when changed directly in the area inputs

  // Persist uploaded designs (sanitized: we only keep name/url)
  useEffect(() => {
    try {
      const sanitized = {};
      for (const k in uploadedDesigns) {
        if (!uploadedDesigns[k]) continue;
        const { file, ...rest } = uploadedDesigns[k] || {};
        sanitized[k] = {};
        if (rest.url) sanitized[k].url = rest.url;
        if (rest.name) sanitized[k].name = rest.name;
      }
      mergePayload({ uploadedDesigns: sanitized });
    } catch (err) {}
  }, [uploadedDesigns, mergePayload]);

  // Helper to pick first src from an array or return string as-is
  const pickSrc = (maybeArrayOrString, fallback) => {
    if (!maybeArrayOrString) return fallback || '';
    if (Array.isArray(maybeArrayOrString)) return maybeArrayOrString[0] || fallback || '';
    return maybeArrayOrString;
  };

  // Toggle color selection; on mobile, scroll to the relevant size matrix after selection
  const handleToggleColor = (color) => {
    setSelectedColors(prev => {
      const set = new Set(prev || []);
      if (set.has(color)) set.delete(color);
      else set.add(color);
      const next = Array.from(set);

      // After state updates, if the color was just added, scroll to its size matrix (all viewports)
      if (next.includes(color)) {
        // wait a tick for DOM to update
        setTimeout(() => {
          try {
            const el = document.getElementById(`size-matrix-${color}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch {}
        }, 180);
      }

      return next;
    });
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
    // total across all selected color matrices
    const totalQty = Object.values(sizeMatrices).reduce((sum, matrix) => {
      if (!matrix) return sum;
      return sum + Object.values(matrix).reduce((s2, q) => s2 + (q || 0), 0);
    }, 0);

    if (totalQty === 0) return { totalQty: 0, breakdown: {}, totalIls: 0 };

    const rules = pricingRules[product.sku];
    // Defensive: some SKUs (e.g. dryfit) may not have explicit pricingRules defined.
    // Fall back to product.basePrice when tiers are absent to avoid runtime errors.
    let unitPrice;
    if (rules && Array.isArray(rules.tiers) && rules.tiers.length > 0) {
      const tier = rules.tiers.find(t => totalQty >= t.min && totalQty <= t.max);
      unitPrice = tier ? tier.price : rules.tiers[rules.tiers.length - 1].price;
    } else {
      unitPrice = product.basePrice || 0;
    }

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

  const deliveryCost = (payload && payload.withDelivery) ? Math.ceil(totalQty / 50) * 50 : 0;

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

  // Update a specific selectedPrintAreas entry with a small patch (e.g., printColor or designerComments)
  const updateAreaField = (areaKey, patch) => {
    const next = (selectedPrintAreas || []).map(s => {
      if (!s) return s;
      if (typeof s === 'string') {
        if (s === areaKey) return { areaKey, method: 'print', ...patch };
        return s;
      }
      if (s.areaKey === areaKey) return { ...s, ...patch };
      return s;
    });
    setSelectedPrintAreas(next);
    try { mergePayload({ selectedPrintAreas: next }); } catch (er) {}
  };

  const handleAddToCart = () => {
    const pricing = calculatePrice();
    // Require at least one color selection
    if (!selectedColors || selectedColors.length === 0) {
      toast({ title: language === 'he' ? 'נא לבחור צבע' : 'Please select a color', variant: 'destructive' });
      return;
    }

    // NOTE: Blank products (no selected print areas) are allowed now.
    // Users can order products without selecting any print area (e.g., plain garments).

    // Build a cart item that supports multiple colors. For backward compatibility, still
    // include `color` and `sizeMatrix` keys using the first selected color if only one.
    const cartItem = {
      productSku: product.sku,
      productName: language === 'he' ? product.nameHe : product.name,
      // legacy single color (first selected) used by old flows
      color: (selectedColors && selectedColors[0]) || null,
      // legacy single sizeMatrix for old consumers (first selected color)
      sizeMatrix: (selectedColors && selectedColors[0]) ? (sizeMatrices[selectedColors[0]] || {}) : {},
      // new multi-color representation
      selectedColors: selectedColors || [],
      sizeMatrices: sizeMatrices,
      // store the selected areas with methods
      selectedPrintAreas,
  uploadedDesigns,
  withDelivery: payload?.withDelivery,
      totalPrice: pricing.totalIls,
      priceBreakdown: pricing.breakdown,
      // mockup: if a color is selected, use its image; otherwise use base image
      mockupUrl: pickSrc((selectedColors && selectedColors[0]) ? product.images[selectedColors[0]] : product.images.base1, product.images.base1)
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
  // Allow adding to cart when there's a positive quantity and at least one color chosen.
  // We no longer require selecting print areas so users can order blank products.
  const canAddToCart = pricing.totalQty > 0 && (selectedColors && selectedColors.length > 0);

  // Structured data: compute Product and Breadcrumb JSON-LD objects
  const productImagesAbs = React.useMemo(() => {
    try {
      const vals = Object.values(product.images || {}).flat().filter(Boolean);
      return vals.map((p) => (typeof p === 'string' ? p : '')).filter(Boolean).map((p) => p.startsWith('http') ? p : `https://printeam.co.il${p}`);
    } catch {
      return [];
    }
  }, [product]);

  const productOffers = React.useMemo(() => {
    const rules = pricingRules && pricingRules[product.sku];
    if (rules && Array.isArray(rules.tiers) && rules.tiers.length > 0) {
      const prices = rules.tiers.map(t => t.price);
      return {
        "@type": "AggregateOffer",
        priceCurrency: "ILS",
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: String(rules.tiers.length),
        availability: "https://schema.org/InStock"
      };
    }
    return {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: Number(product.basePrice || 0).toFixed(2),
      availability: "https://schema.org/InStock"
    };
  }, [product]);

  const productLd = React.useMemo(() => {
    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: language === 'he' ? product.nameHe : product.name,
      description: desc,
      brand: "Printeam",
      sku: product.sku,
      image: productImagesAbs.slice(0, 10),
      offers: productOffers
    };

    // Attach product specs as additionalProperty for better SEO (localized)
    try {
      const specs = product.specs || {};
      const additionalProperty = [];
      if (language === 'he') {
        if (specs.materialHe || specs.material) {
          additionalProperty.push({ "@type": "PropertyValue", name: 'הרכב הבד', value: specs.materialHe || specs.material });
        }
        if (specs.weightHe || specs.weight) {
          additionalProperty.push({ "@type": "PropertyValue", name: 'משקל', value: specs.weightHe || specs.weight });
        }
        if (specs.careHe || specs.care) {
          additionalProperty.push({ "@type": "PropertyValue", name: 'הוראות טיפול', value: specs.careHe || specs.care });
        }
      } else {
        if (specs.material) additionalProperty.push({ "@type": "PropertyValue", name: 'Material', value: specs.material });
        if (specs.weight) additionalProperty.push({ "@type": "PropertyValue", name: 'Weight', value: specs.weight });
        if (specs.care) additionalProperty.push({ "@type": "PropertyValue", name: 'Care', value: specs.care });
      }
      if (additionalProperty.length) ld.additionalProperty = additionalProperty;
    } catch (e) {
      // defensive: don't break page rendering if specs malformed
    }

    return ld;
  }, [language, product, desc, productImagesAbs, productOffers]);

  const breadcrumbLd = React.useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://printeam.co.il/" },
      { "@type": "ListItem", position: 2, name: "Catalog", item: "https://printeam.co.il/catalog" },
      { "@type": "ListItem", position: 3, name: (language === 'he' ? product.nameHe : product.name), item: `https://printeam.co.il/product/${sku}` }
    ]
  }), [language, product, sku]);

  // Helper to render rich product description with headings, paragraphs, and bullets
  const renderProductDescription = (desc, language) => {
    if (!desc) return null;
    const blocks = desc.split('\n\n');
    return blocks.map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return null;
      const headingPatterns = [
        'מאפייני המוצר:',
        'היתרונות של החולצה:',
        'יתרונות החולצה:',
        'יתרונות המוצר:',
        'יתרונות:',
        'שימושים מומלצים:'
      ];
      const isListBlock = headingPatterns.some(h => trimmed.startsWith(h));
      if (isListBlock) {
        const lines = trimmed.split('\n');
        const heading = lines[0];
        const items = lines.slice(1).map(l => l.trim()).filter(l => l.length > 0);
        return (
          <div key={index} className="mt-4">
            <h3 className="font-semibold text-gray-800">{heading}</h3>
            {items.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-gray-600">
                {items.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            )}
          </div>
        );
      }
      // Treat 'על המוצר' as a heading followed by paragraphs if appears as first line alone
      if (trimmed.startsWith('על המוצר')) {
        const lines = trimmed.split('\n');
        const heading = lines[0];
        const body = lines.slice(1).map(l => l.trim()).filter(Boolean);
        return (
          <div key={index} className="mt-4">
            <h3 className="font-semibold text-gray-800">{heading}</h3>
            {body.map((para, i) => <p key={i} className="text-gray-600 leading-relaxed mt-2">{para}</p>)}
          </div>
        );
      }
      const paragraphs = trimmed.split('\n').filter(p => p.trim());
      return (
        <div key={index} className="mt-2">
          {paragraphs.map((para, i) => <p key={i} className="text-gray-600 leading-relaxed">{para}</p>)}
        </div>
      );
    });
  };

  return (
    <>
      <Helmet>
  <title>{language === 'he' ? product.nameHe : product.name} – Printeam</title>
        <meta name="description" content={`Customize your ${product.name} with our design tool`} />
        <link rel="canonical" href={`https://printeam.co.il/product/${sku}`} />
        {/* Product structured data */}
        <script type="application/ld+json">{JSON.stringify(productLd)}</script>
        {/* BreadcrumbList for Home > Catalog > Product */}
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
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
                {renderProductDescription(desc, language)}
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
                      onClick={() => handleToggleColor(color)}
                      className={`relative aspect-square rounded-lg border-4 transition-all ${
                        (selectedColors || []).includes(color)
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
                {/* Helper line showing which color the sizes apply to */}
                <div className="text-sm text-gray-600 mb-3">
                  {(!selectedColors || selectedColors.length === 0) ? (
                    <span className="text-gray-700 font-medium">
                      {language === 'he' ? 'נא לבחור צבע קודם כדי להגדיר מידות' : 'Please choose a color first to set sizes'}
                    </span>
                  ) : (
                    (language === 'he'
                      ? `${t('chooseSizesForColor')} ${selectedColors.map(c => (colorLabelsHe[c] || c)).join(', ')}`
                      : `${t('chooseSizesForColor')} ${selectedColors.join(', ')}`
                    )
                  )}
                </div>
                {/* Render one SizeMatrix per selected color */}
                <div className="space-y-4">
                  {(!selectedColors || selectedColors.length === 0) ? (
                    <div className="p-6 bg-white rounded-md border border-dashed border-gray-200 text-center text-gray-600">
                      {language === 'he' ? 'בחרו צבע כדי להציג ולהגדיר את טבלת המידות.' : 'Select a color to view and set the size matrix.'}
                    </div>
                  ) : selectedColors.map((color) => {
                    const handleId = `size-matrix-${color}`;
                    const matrix = sizeMatrices[color] || {};
                    const setMatrixForColor = (updater) => {
                      setSizeMatrices(prev => {
                        const prevMatrix = (prev && prev[color]) || {};
                        const newMatrix = typeof updater === 'function' ? updater(prevMatrix) : updater;
                        return { ...(prev || {}), [color]: newMatrix };
                      });
                    };

                    const handleRemoveColor = () => {
                      // remove from selectedColors
                      setSelectedColors(prev => {
                        const next = (prev || []).filter(c => c !== color);
                        return next;
                      });
                      // remove associated size matrix
                      setSizeMatrices(prev => {
                        const copy = { ...(prev || {}) };
                        delete copy[color];
                        return copy;
                      });
                      // persist change into payload
                      try {
                        const nextSizeMatrices = { ...(sizeMatrices || {}) };
                        delete nextSizeMatrices[color];
                        const nextSelectedColors = (selectedColors || []).filter(c => c !== color);
                        mergePayload({ selectedColors: nextSelectedColors, sizeMatrices: nextSizeMatrices });
                      } catch (err) {
                        // ignore
                      }
                    };

                    return (
                      <div id={handleId} key={color} className="bg-gray-50 rounded-md p-3 flex items-start gap-4">
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={handleRemoveColor}
                            aria-label={language === 'he' ? 'הסר צבע' : 'Remove color'}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Trash2 className="h-6 w-6 text-red-500" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {language === 'he' ? (colorLabelsHe[color] || color) : color}
                          </div>
                          <SizeMatrix
                            sizeRange={product.sizeRange}
                            sizeMatrix={matrix}
                            onChange={(u) => setMatrixForColor(u)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('totalQuantity')}: {pricing.totalQty}
                  </span>
                </div>

                {/* Show quantity->price tiers table for transparency */}
                <div className="mt-2">
                  <PricingTiers
                    tiers={(pricingRules[product.sku] && pricingRules[product.sku].tiers) || []}
                    currentQty={pricing.totalQty}
                    basePrice={product.basePrice}
                  />
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
                {/* per-area comments/print color are rendered below with the upload area so they are tied to each selected area */}
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
                      const selObj = typeof sel === 'string' ? { areaKey: sel, method: 'print' } : sel;
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
                            onColorChoice={(aKey, v) => updateAreaField(aKey, { printColor: v })}
                            onDesignerNotesChange={(aKey, notes) => updateAreaField(aKey, { designerComments: notes })}
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

              {/* Delivery moved to Cart page */}
            </div>

            {/* Sticky sidebar on desktop: apply sticky to the grid item itself for robust behavior in CSS Grid */}
            <div
              className="lg:col-span-1 lg:self-start lg:sticky"
              style={{ top: 'var(--header-height, 120px)' }}
            >
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