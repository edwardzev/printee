import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';

const Returns = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('returnsTitle')} - Print Market</title>
        <meta name="description" content={`Read the ${t('returnsTitle')} policy for Print Market.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {t('returnsTitle')}
            </h1>
            <div className="prose max-w-none text-gray-600">
              <p>
                We want you to be completely satisfied with your custom apparel order. If you are not satisfied with your purchase, please review our policy on returns and exchanges below.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Customized Products</h2>
              <p>
                Due to the custom nature of our products, we cannot accept returns or offer refunds for items that are free of defects or errors. All sales of customized products are final.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Defective or Incorrect Orders</h2>
              <p>
                If you receive an order that is defective, damaged, or incorrect, please contact us within 7 days of receiving your order. We will be happy to assist you with a replacement or a refund. To be eligible, please provide the following:
              </p>
              <ul>
                <li>Your order number</li>
                <li>A description of the issue</li>
                <li>Photographic evidence of the defect or error</li>
              </ul>
              <p>
                Upon verification, we will arrange for a replacement order to be produced and shipped to you at no additional cost. If a replacement is not possible, a full refund will be issued.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Contact Us</h2>
              <p>
                If you have any questions about our Returns and Exchanges Policy, please contact us at info@printmarket.co.il.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Returns;