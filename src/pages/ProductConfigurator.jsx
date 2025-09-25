import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { products, printAreas, pricingRules } from '@/data/products';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SizeMatrix from '@/components/SizeMatrix';
import PrintAreaSelector from '@/components/PrintAreaSelector';
import MockupCanvas from '@/components/MockupCanvas';
import PricePanel from '@/components/PricePanel';
import DeliveryOptions from '@/components/DeliveryOptions';

const ProductConfigurator = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const product = products.find(p => p.sku === sku);
  
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeMatrix, setSizeMatrix] = useState({});
  const [selectedPrintAreas, setSelectedPrintAreas] = useState([]);
  const [uploadedDesigns, setUploadedDesigns] = useState({});
  const [withDelivery, setWithDelivery] = useState(false);

  useEffect(() => {
    if (product && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

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

  const calculatePrice = () => {
    const totalQty = Object.values(sizeMatrix).reduce((sum, qty) => sum + (qty || 0), 0);
    
    if (totalQty === 0) return { totalQty: 0, breakdown: {}, totalIls: 0 };

    const rules = pricingRules[product.sku];
    const tier = rules.tiers.find(t => totalQty >= t.min && totalQty <= t.max);
    const unitPrice = tier ? tier.price : rules.tiers[rules.tiers.length - 1].price;

    const baseTotal = unitPrice * totalQty;
    
    const placementFees = selectedPrintAreas.reduce((sum, areaKey) => {
      const area = printAreas[areaKey];
      return sum + (area ? area.fee * totalQty : 0);
    }, 0);

    const deliveryCost = withDelivery ? Math.ceil(totalQty / 50) * 50 : 0;

    const grandTotal = baseTotal + placementFees + deliveryCost;

    return {
      totalQty,
      breakdown: {
        unitBase: unitPrice,
        baseTotal,
        placementFeesPerUnit: selectedPrintAreas.reduce((sum, areaKey) => {
          const area = printAreas[areaKey];
          return sum + (area ? area.fee : 0);
        }, 0),
        placementFeesTotal: placementFees,
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
      toast({
        title: t('uploadSuccess'),
        description: `${file.name} uploaded for ${printAreas[areaKey]?.label || areaKey}`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const pricing = calculatePrice();
    
    if (pricing.totalQty < 10) {
      toast({
        title: t('minimumQuantity'),
        variant: 'destructive'
      });
      return;
    }

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
      selectedPrintAreas,
      uploadedDesigns,
      withDelivery,
      totalPrice: pricing.totalIls,
      priceBreakdown: pricing.breakdown,
      mockupUrl: product.images[selectedColor]
    };

    addToCart(cartItem);
    toast({
      title: t('addedToCart'),
      description: `${pricing.totalQty} items added to cart`
    });
  };

  const pricing = calculatePrice();
  const canAddToCart = pricing.totalQty >= 10 && selectedPrintAreas.length > 0;

  return (
    <>
      <Helmet>
        <title>{language === 'he' ? product.nameHe : product.name} - Print Market</title>
        <meta name="description" content={`Customize your ${product.name} with our design tool`} />
      </Helmet>

      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 pb-48 lg:pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {language === 'he' ? product.nameHe : product.name}
                </h1>
                <p className="text-gray-600">{product.tech} Printing Technology</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
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
                        src={product.images[color]}
                        alt={`${product.name} in ${color}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-xs font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded capitalize">
                          {color}
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
                className="bg-white rounded-xl p-6 shadow-lg"
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
                  {pricing.totalQty < 10 && (
                    <span className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {t('minOrder')}
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. {t('printAreas')}
                </h2>
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
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    4. {t('uploadDesign')}
                  </h2>
                  <div className="space-y-6">
                    {selectedPrintAreas.map((areaKey) => (
                      <div key={areaKey} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          {language === 'he' ? printAreas[areaKey]?.labelHe : printAreas[areaKey]?.label}
                        </h3>
                        <MockupCanvas
                          areaKey={areaKey}
                          baseImage={product.images[selectedColor]}
                          onFileUpload={(file) => handleFileUpload(areaKey, file)}
                          uploadedDesign={uploadedDesigns[areaKey]}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {pricing.totalQty > 0 && (
                 <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    5. {t('deliveryOptions')}
                  </h2>
                  <DeliveryOptions
                    totalQty={pricing.totalQty}
                    withDelivery={withDelivery}
                    onDeliveryChange={setWithDelivery}
                  />
                </motion.div>
              )}
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