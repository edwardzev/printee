import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/contexts/LanguageContext';

const Returns = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('returnsTitle')} - Printeam</title>
        <meta name="description" content={`Read the ${t('returnsTitle')} policy for Printeam.`} />
        <link rel="canonical" href="https://printeam.co.il/returns" />
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
                אנו רוצים שתהיו מרוצים מההזמנה המותאמת שלכם. מדיניות ההחזרות וההחלפות שלנו מוצגת להלן.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">מוצרים מותאמים אישית</h2>
              <p>
                עקב אופי המוצרים המותאמים, אין אנו מקבלים החזרות או מעניקים החזרים עבור פריטים ללא פגם או טעות בייצור. הזמנות של מוצרים מותאמים הן סופיות, אלא אם נגרם פגם במוצר.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">מוצרים פגומים או שגויים</h2>
              <p>
                אם קיבלתם מוצר פגום, ניזוק או שגוי, יש ליצור איתנו קשר תוך 7 ימים מקבלת ההזמנה. נשקף פתרון מהיר - החלפת מוצר, תיקון או החזר כספי בהתאם למקרה.
              </p>
              <p>להגשת בקשה יש לספק:</p>
              <ul>
                <li>מספר הזמנה</li>
                <li>תיאור הבעיה</li>
                <li>תמונות ברורות המפרטות את הפגם או השגיאה</li>
              </ul>

              <p>
                לאחר בדיקה ואימות, נדאג לייצור והטבת משלוח של החלפה ללא עלות נוספת. אם לא ניתן יהיה להחליף, יינתן החזר מלא בהתאם למדיניות.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">צור קשר</h2>
              <p>
                לשאלות או בקשות לגבי החזרות והחלפות פנו אלינו בכתובת: info@printeam.co.il
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Returns;