import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const faqs = [
  {
    q: 'כמה זמן לוקח הייצור?',
    a: 'זמן הייצור הרגיל הוא 3–4 ימי עסקים (תלוי בכמות) לאחר אישור העיצוב והתשלום לאיסוף עצמי. משלוח לוקח בערך 3 ימי עסקים נוספים.'
  },
  {
    q: 'מהיכן ניתן לאסוף הזמנות מוכנות?',
    a: 'כתובתנו: רחוב האורגים 32, חולון.'
  },
  {
    q: 'מהי הכמות המינימלית?',
    a: 'כמות מינימלית היא 1 יחידה, אך ישנם מבצעים לכמויות גדולות שמופיעים בחישוב המחיר.'
  },
  {
    q: 'אילו פורמטים של קבצים מקובל להעלות?',
    a: 'PNG, JPG, ו-PDF רצויים. עבור איכות מיטבית: עדיף לצרף קובץ ללא רקע. זיכרו: ככל שהתמונה באיכות יותר טובה, כך גם ההדפסה תהיה יותר איכותית.  '
  },
  
  {
    q: 'איך חושבת עלות המשלוח?',
    a: 'המשלוח מחושב כ-₪50 לכל 50 פריטים (מעוגל כלפי מעלה).' 
  },
  
  {
    q: 'מהי מדיניות ההחזרים?',
    a: 'החזרות והחלפות כפופות למדיניות האתר — מוצרים מותאמים אישית אינם ניתנים להחזרה ללא פגם ייצור.'
  },
  {
    q: 'אילו שיטות תשלום נתמכות?',
    a: 'כרטיסי אשראי, ביט, פייבוקס,תשלום מקוון וחשבונית לחברות (בהתאם להסדר).' 
  },
  {
    q: 'איך ליצור קשר לתמיכה?',
  a: 'ניתן לפנות דרך ווטסאפ בכפתור קישור למעלה. או לשלוח מייל ל-info@printmarket.co.il' 
  },
  {
    q: 'האם יש מבצעים לכמויות גדולות?',
    a: 'כן — תעריפי יחידה יורדים ככל שהכמות עולה; פירוט מופיע בחישוב המחיר בדף המוצר.'
  }
];

export default function FAQ() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen py-12">
      <Helmet>
        <title>שאלות נפוצות – Printeam</title>
        <link rel="canonical" href="https://printeam.co.il/faq" />
        {/* FAQPage structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a
              }
            }))
          })}
        </script>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">שאלות נפוצות</h1>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
              <p className="text-gray-700">{item.a}</p>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
