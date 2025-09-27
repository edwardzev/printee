import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowRight, Zap, DollarSign, Palette } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import HeroImage from '@/components/HeroImage';

const Home = () => {
  const { t, isRTL } = useLanguage();

  const features = [
    {
      icon: Zap,
      title: t('fastDelivery'),
      description: t('fastDeliveryDesc')
    },
    {
      icon: DollarSign,
      title: t('bestPrices'),
      description: t('bestPricesDesc')
    },
    {
      icon: Palette,
      title: t('easyDesign'),
      description: t('easyDesignDesc')
    }
  ];

  return (
    <>
      <Helmet>
        <title>{t('heroTitle')} - Print Market</title>
        <meta name="description" content={t('heroSubtitle')} />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-white py-14 lg:py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Copy column */}
            <div className="text-right">
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 mb-4">
                הדפיסו את החולצות שלכם אונליין – פשוט, מהיר, משתלם
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8">
                מעלים עיצוב, בוחרים בגד, ומקבלים הזמנה מוכנה תוך ימים
              </p>
              <div className="flex gap-3 justify-end flex-wrap">
                <Link to="/catalog">
                  <Button size="lg" className="bg-gray-900 text-white hover:bg-black px-6 py-6">
                    התחילו לעצב עכשיו
                    <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                  </Button>
                </Link>
                <a href="#how" className="inline-flex">
                  <Button size="lg" variant="outline" className="px-6 py-6">
                    ראו איך זה עובד
                  </Button>
                </a>
              </div>
            </div>

            {/* Carousel column */}
            <div className="rounded-xl overflow-hidden shadow-sm bg-[#f6f7f9]">
              <HeroImage bg="#f6f7f9" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {t('whyChooseUs')}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 card-hover"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                מוכנים ליצור בגדים מודפסים מותאמים אישית?
              </h2>
              
              <Link to="/catalog">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4">
                  {t('startOrder')}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;