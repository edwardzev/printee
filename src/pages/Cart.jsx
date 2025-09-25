import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ShoppingBag, Trash2, Edit, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Cart = () => {
  const { t, language } = useLanguage();
  const { cartItems, removeFromCart, getTotalPrice } = useCart();
  const { toast } = useToast();

  const handleCheckout = () => {
    toast({
      title: t('notImplemented')
    });
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    toast({
      title: 'Item removed from cart'
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
                  Start designing your custom apparel today!
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
              Review your items and proceed to checkout
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
                        src={item.mockupUrl}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Color: {item.color} • {Object.values(item.sizeMatrix).reduce((sum, qty) => sum + qty, 0)} units
                      </p>
                      
                      {/* Size breakdown */}
                      <div className="text-sm text-gray-500 mb-2">
                        {Object.entries(item.sizeMatrix)
                          .filter(([size, qty]) => qty > 0)
                          .map(([size, qty]) => `${size.toUpperCase()}: ${qty}`)
                          .join(', ')}
                      </div>

                      {/* Print areas */}
                      <div className="text-sm text-gray-500 mb-3">
                        Print areas: {item.selectedPrintAreas.join(', ')}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-600">
                          ₪{item.totalPrice.toLocaleString()}
                        </span>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast({ title: t('notImplemented') })}
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
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₪{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (17%)</span>
                    <span className="font-medium">₪{Math.round(getTotalPrice() * 0.17).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₪{Math.round(getTotalPrice() * 1.17).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mb-4" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  {t('checkout')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <Link to="/catalog">
                  <Button variant="outline" className="w-full">
                    {t('continueShopping')}
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