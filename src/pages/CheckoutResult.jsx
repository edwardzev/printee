import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const CheckoutResult = ({ success = true }) => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{success ? 'Order Successful' : 'Order Failed'} - Print Market</title>
        <meta name="description" content={success ? 'Your order has been placed successfully' : 'There was an issue with your order'} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-8">
              {success ? (
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
              )}
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {success ? 'Order Successful!' : 'Order Failed'}
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                {success 
                  ? 'Thank you for your order! We\'ll start processing it right away.'
                  : 'There was an issue processing your order. Please try again.'
                }
              </p>

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                  <h2 className="text-lg font-semibold text-green-800 mb-2">
                    Order Details
                  </h2>
                  <p className="text-green-700">
                    Order Number: #PM-{Date.now().toString().slice(-6)}
                  </p>
                  <p className="text-green-700">
                    Estimated delivery: 5-7 business days
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Link to="/catalog">
                  <Button size="lg">
                    {success ? 'Order More Items' : 'Try Again'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                
                <div>
                  <Link to="/">
                    <Button variant="outline">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CheckoutResult;