import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('termsTitle')} - Print Market</title>
        <meta name="description" content={`Read the ${t('termsTitle')} for Print Market.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {t('termsTitle')}
            </h1>
            <div className="prose max-w-none text-gray-600">
              <p>
                Welcome to Print Market. These terms and conditions outline the rules and regulations for the use of Print Market's Website, located at printmarket.co.il.
              </p>
              <p>
                By accessing this website we assume you accept these terms and conditions. Do not continue to use Print Market if you do not agree to take all of the terms and conditions stated on this page.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Cookies</h2>
              <p>
                We employ the use of cookies. By accessing Print Market, you agreed to use cookies in agreement with the Print Market's Privacy Policy.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">License</h2>
              <p>
                Unless otherwise stated, Print Market and/or its licensors own the intellectual property rights for all material on Print Market. All intellectual property rights are reserved. You may access this from Print Market for your own personal use subjected to restrictions set in these terms and conditions.
              </p>
              <p>You must not:</p>
              <ul>
                <li>Republish material from Print Market</li>
                <li>Sell, rent or sub-license material from Print Market</li>
                <li>Reproduce, duplicate or copy material from Print Market</li>
                <li>Redistribute content from Print Market</li>
              </ul>
              <p>This Agreement shall begin on the date hereof.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Terms;