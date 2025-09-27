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
                ברוכים הבאים ל-Print Market. מסמך תנאי השימוש זה מגדיר את הכללים וההגבלות לשימוש באתר שלנו, הנמצא בכתובת printmarket.co.il.
              </p>
              <p>
                באמצעות הגלישה והשימוש באתר אתם מסכימים לתנאי השימוש אלה במלואם. אם אינכם מסכימים עם תנאי השימוש, נא לא להמשיך ולשימוש באתר.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">שימוש בעוגיות (Cookies)</h2>
              <p>
                האתר עושה שימוש בעוגיות כדי לשפר את חוויית המשתמש, לאסוף נתונים אנונימיים לניתוח ובכדי לאחסן בחירות תצוגה בסיסיות. לשימוש בעוגיות יש חשיבות לתפעול תקין של חלק מהשירותים.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">קניין רוחני והגנה על זכויות יוצרים</h2>
              <p>
                כל התכנים, העיצובים, הלוגואים והחומרים המוצגים באתר הינם בבעלות Print Market או מורשים לשימוש על ידה, ומוגנים על ידי דיני זכויות יוצרים ו/או זכויות קניין רוחני אחרות.
              </p>
              <p>
                זכויות יוצרים והגנה: כל הזכויות שמורות. אין להעתיק, לשכפל, לשדר, להפיץ, להציג בפומבי או ליצור עבודות נגזרות מכל חלק מהחומרים באתר ללא אישור בכתב ובמפורש של Print Market. כל שימוש לא מורשה ייחשב להפרה וייעשה בו שימוש בכל האמצעים המשפטיים העומדים לרשות החברה, לרבות דרישה לנזקים והוצאת צו מניעה.
              </p>

              <h2 className="text-2xl font-semibold mt-6 mb-4">הגבלות שימוש</h2>
              <p>אי שימוש או שימוש אסור בתכנים האתר עלול להביא להשלכות משפטיות. בין הדברים שאינם מותרות:
              </p>
              <ul>
                <li>שכפול וחזרת פרסום של תכני האתר ללא הרשאה</li>
                <li>מכירה, השכרה או רישוי משנה של תכני האתר</li>
                <li>שימוש בתכנים למטרות מסחריות ללא אישור</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-6 mb-4">התחלת ההסכם</h2>
              <p>תנאים אלה נכנסים לתוקף ממועד השימוש באתר וממשיכים להיות בתוקף כל עוד אתם משתמשים באתר.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Terms;