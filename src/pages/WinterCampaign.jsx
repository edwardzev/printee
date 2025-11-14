import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';
import { products } from '@/data/products';
import { Button } from '@/components/ui/button';

const WinterCampaign = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Filter existing winter garments
  const winterGarments = products.filter(p => 
    ['hoodie', 'sweatshirt', 'fleece', 'softshell', 'longsleeve', 'zipped_hood'].includes(p.sku)
  );

  // Placeholder winter products (these will be added to the products catalog later)
  const placeholderProducts = [
    {
      sku: 'winter_beanie',
      name: 'Winter Beanie',
      nameHe: 'כובע גרב חורף',
      description: 'Cozy knitted beanie to keep you warm',
      descriptionHe: 'כובע גרב חם ונעים לימי החורף',
      image: 'https://via.placeholder.com/400x400/2C5F7F/FFFFFF?text=Winter+Beanie',
      price: 40,
      isPlaceholder: true
    },
    {
      sku: 'thermal_mug',
      name: 'Thermal Mug',
      nameHe: 'ספל תרמי',
      description: 'Insulated thermal mug for hot beverages',
      descriptionHe: 'ספל תרמי מבודד לשמירה על חום המשקאות',
      image: 'https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Thermal+Mug',
      price: 60,
      isPlaceholder: true
    },
    {
      sku: 'winter_scarf',
      name: 'Winter Scarf',
      nameHe: 'צעיף חורף',
      description: 'Soft and warm winter scarf',
      descriptionHe: 'צעיף חורף רך וחם',
      image: 'https://via.placeholder.com/400x400/DC143C/FFFFFF?text=Winter+Scarf',
      price: 50,
      isPlaceholder: true
    },
    {
      sku: 'knit_gloves',
      name: 'Knit Gloves',
      nameHe: 'כפפות סרוגות',
      description: 'Comfortable knitted gloves',
      descriptionHe: 'כפפות סרוגות נוחות',
      image: 'https://via.placeholder.com/400x400/4B0082/FFFFFF?text=Knit+Gloves',
      price: 35,
      isPlaceholder: true
    },
    {
      sku: 'fleece_blanket',
      name: 'Fleece Blanket',
      nameHe: 'שמיכת פליס',
      description: 'Warm fleece blanket perfect for winter',
      descriptionHe: 'שמיכת פליס חמה ומושלמת לחורף',
      image: 'https://via.placeholder.com/400x400/708090/FFFFFF?text=Fleece+Blanket',
      price: 120,
      isPlaceholder: true
    },
    {
      sku: 'neck_warmer',
      name: 'Neck Warmer',
      nameHe: 'מחמם צוואר',
      description: 'Cozy neck warmer for cold days',
      descriptionHe: 'מחמם צוואר נעים לימים קרים',
      image: 'https://via.placeholder.com/400x400/FF8C00/FFFFFF?text=Neck+Warmer',
      price: 45,
      isPlaceholder: true
    },
    {
      sku: 'thermal_socks',
      name: 'Thermal Socks',
      nameHe: 'גרביים תרמיות',
      description: 'Thick thermal socks for warmth',
      descriptionHe: 'גרביים תרמיות עבות לחימום',
      image: 'https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=Thermal+Socks',
      price: 30,
      isPlaceholder: true
    },
    {
      sku: 'winter_vest',
      name: 'Winter Vest',
      nameHe: 'אפוד חורף',
      description: 'Insulated winter vest',
      descriptionHe: 'אפוד חורף מבודד',
      image: 'https://via.placeholder.com/400x400/556B2F/FFFFFF?text=Winter+Vest',
      price: 140,
      isPlaceholder: true
    },
    {
      sku: 'ear_muffs',
      name: 'Ear Muffs',
      nameHe: 'מחממי אזניים',
      description: 'Soft ear muffs for winter',
      descriptionHe: 'מחממי אזניים רכים לחורף',
      image: 'https://via.placeholder.com/400x400/C71585/FFFFFF?text=Ear+Muffs',
      price: 35,
      isPlaceholder: true
    },
    {
      sku: 'insulated_jacket',
      name: 'Insulated Jacket',
      nameHe: 'מעיל מבודד',
      description: 'Heavy-duty insulated winter jacket',
      descriptionHe: 'מעיל חורף מבודד כבד',
      image: 'https://via.placeholder.com/400x400/191970/FFFFFF?text=Insulated+Jacket',
      price: 180,
      isPlaceholder: true
    },
    {
      sku: 'winter_backpack',
      name: 'Winter Backpack',
      nameHe: 'תיק גב חורף',
      description: 'Water-resistant winter backpack',
      descriptionHe: 'תיק גב חורף עמיד במים',
      image: 'https://via.placeholder.com/400x400/1C1C1C/FFFFFF?text=Winter+Backpack',
      price: 150,
      isPlaceholder: true
    },
    {
      sku: 'heated_cushion',
      name: 'Heated Cushion',
      nameHe: 'כרית מחוממת',
      description: 'Electric heated cushion',
      descriptionHe: 'כרית חימום חשמלית',
      image: 'https://via.placeholder.com/400x400/8B0000/FFFFFF?text=Heated+Cushion',
      price: 90,
      isPlaceholder: true
    },
    {
      sku: 'winter_cap',
      name: 'Winter Cap',
      nameHe: 'כובע חורף',
      description: 'Stylish winter cap with ear flaps',
      descriptionHe: 'כובע חורף מעוצב עם דשים',
      image: 'https://via.placeholder.com/400x400/483D8B/FFFFFF?text=Winter+Cap',
      price: 55,
      isPlaceholder: true
    },
    {
      sku: 'thermal_leggings',
      name: 'Thermal Leggings',
      nameHe: 'טייץ תרמי',
      description: 'Warm thermal leggings',
      descriptionHe: 'טייץ תרמי חם',
      image: 'https://via.placeholder.com/400x400/000080/FFFFFF?text=Thermal+Leggings',
      price: 70,
      isPlaceholder: true
    }
  ];

  // Combine all products (min 20 items)
  const allWinterProducts = [...winterGarments, ...placeholderProducts];

  const formatILS = (v) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0
    }).format(v);

  const pick = (arr, fallback) => {
    if (!Array.isArray(arr) || !arr.length) return fallback;
    return arr.find(x => /(\.jpe?g|\.png)$/i.test(x)) || arr[0];
  };

  const rewriteLegacy = (src, sku) => {
    if (!src || typeof src !== 'string') return src;
    try {
      const m = src.match(/^(.*)\/base_(1|2)(\.[^.]+)?$/);
      if (m) {
        const ext = m[3] || '.png';
        return `/product_images/${sku}/base${m[2]}_${sku}${ext}`;
      }
    } catch {}
    return src;
  };

  const getProductImage = (product) => {
    if (product.isPlaceholder) {
      return product.image;
    }
    return rewriteLegacy(
      pick(product.images?.base1, `/product_images/${product.sku}/base1_${product.sku}.png`),
      product.sku
    );
  };

  const getProductPrice = (product) => {
    if (product.isPlaceholder) {
      return product.price;
    }
    return product.basePrice;
  };

  return (
    <>
      <Helmet>
        <title>מבצע חורף - Printeam</title>
        <meta name="description" content="מבצע חורף מיוחד על ביגוד ומוצרים חמים ונעימים. קולקציית חורף עם הנחה מיוחדת!" />
        <link rel="canonical" href="https://printeam.co.il/winter-campaign" />
      </Helmet>

      <div className="min-h-screen">
        {/* Winter Campaign Banner */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-16 lg:py-24 overflow-hidden">
          {/* Decorative snowflakes */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-6xl">❄</div>
            <div className="absolute top-20 right-20 text-4xl">❄</div>
            <div className="absolute bottom-10 left-1/4 text-5xl">❄</div>
            <div className="absolute top-1/3 right-1/3 text-3xl">❄</div>
            <div className="absolute bottom-20 right-10 text-6xl">❄</div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
                מבצע חורף מיוחד ❄️
              </h1>
              <p className="text-xl lg:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed">
                התחממו איתנו בחורף! קולקציית חורף חמה ונעימה עם מבצעים מיוחדים
              </p>
              <div className="inline-block bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full px-8 py-4 mb-8">
                <p className="text-2xl lg:text-3xl font-bold">
                  🎁 הנחה מיוחדת על כל המוצרים 🎁
                </p>
              </div>
              <p className="text-lg lg:text-xl max-w-2xl mx-auto opacity-90">
                ביגוד חם ואיכותי, אביזרים מחממים ומוצרים נוספים - הכל במקום אחד!
                <br />
                הזדרזו להנות ממחירים מיוחדים לעונת החורף
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12 lg:py-16 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                הקולקציה השלמה שלנו לחורף
              </h2>
              <p className="text-xl text-gray-600">
                למעלה מ-{allWinterProducts.length} מוצרים חמים ונעימים במחירים מיוחדים
              </p>
            </motion.div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allWinterProducts.map((product, index) => (
                <motion.div
                  key={product.sku}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer group relative"
                  onClick={() => {
                    if (!product.isPlaceholder) {
                      navigate(`/product/${product.sku}`);
                    }
                  }}
                >
                  {product.isPlaceholder && (
                    <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      בקרוב
                    </div>
                  )}
                  
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={getProductImage(product)}
                      alt={language === 'he' ? product.nameHe : product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {language === 'he' ? product.nameHe : product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {language === 'he' ? product.descriptionHe || product.description : product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {formatILS(getProductPrice(product))}
                      </span>
                      
                      {!product.isPlaceholder && (
                        <Link
                          to={`/product/${product.sku}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" className="text-xs">
                            {language === 'he' ? 'בחר מוצר' : 'Select'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-center mt-16"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  מוכנים להזמין?
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  גלשו בקטלוג המלא שלנו ובחרו את המוצרים המושלמים לחורף
                </p>
                <Link to="/catalog">
                  <Button size="lg" className="px-8 py-4 text-lg rounded-full">
                    לקטלוג המלא
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default WinterCampaign;
