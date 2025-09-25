import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('privacyTitle')} - Print Market</title>
        <meta name="description" content={`Read the ${t('privacyTitle')} for Print Market.`} />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {t('privacyTitle')}
            </h1>
            <div className="prose max-w-none text-gray-600">
              <p>
                At Print Market, accessible from printmarket.co.il, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Print Market and how we use it.
              </p>
              <p>
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Log Files</h2>
              <p>
                Print Market follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
              </p>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Information We Collect</h2>
              <p>
                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
              </p>
              <p>
                If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Privacy;