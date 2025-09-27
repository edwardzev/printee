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
                פרטיות המשתמש חשובה לנו ב-Print Market. מדיניות פרטיות זו מתארת אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם וכיצד אנו מגינים עליהם.
              </p>
              <p>
                אם יש לכם שאלות נוספות לגבי מדיניות הפרטיות, אנא צרו קשר במייל: info@printmarket.co.il
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">נתונים שאנו אוספים</h2>
              <p>
                אנו אוספים מידע שמספקים אתם ישירות (למשל: שם, כתובת אימייל, כתובת למשלוח), וכן נתוני שימוש אנונימיים (למשל: כתובת IP, סוג דפדפן, דפי כניסה/יציאה) לצורך שיפור השירות וניתוח סטטיסטי.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">שימוש במידע</h2>
              <p>
                המידע משמש לצורך עיבוד והשלמת הזמנות, תקשורת עם הלקוחות, שיפור המוצר והשירות, ומטרות אבטחה ומניעת הונאות.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">שיתוף מידע עם צדדים שלישיים</h2>
              <p>
                אנו לא נשתף מידע אישי עם גורמים חיצוניים למעט ספקי שירות הנדרשים לעיבוד ההזמנה (כגון חברות שילוח, ספקי תשלום) וכשחוק מחייב זאת.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">אבטחת מידע</h2>
              <p>
                אנו משתמשים בפרקטיקות אבטחה מקובלות לשמירה על המידע. יחד עם זאת, אין ערבויות אבטחה מוחלטות באופן מקוון, ולכן חשוב לנקוט באמצעי זהירות בעצמכם (למשל: לא לשתף סיסמאות).
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Privacy;