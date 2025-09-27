import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const faqs = [
  {
    q: 'כמה זמן לוקח הייצור?',
    a: 'זמן הייצור הרגיל הוא 3–7 ימי עסקים לאחר אישור העיצוב והתשלום.'
  },
  {
    q: 'מהי הכמות המינימלית?',
    a: 'כמות מינימלית היא 1 יחידה, אך ישנם מבצעים לכמויות גדולות שמופיעים בחישוב המחיר.'
  },
  {
    q: 'אילו פורמטים של קבצים מקובל להעלות?',
    a: 'PNG, JPG, SVG ו-PDF רצויים. עבור איכות מיטבית: SVG לוקטורים או PNG בגודל גבוה.'
  },
  {
    q: 'האם אפשר לקבל דוגמת בד לפני ההזמנה?',
    a: 'כן — ניתן לבקש דוגמה בתעריף מיוחד. שלחו בקשה דרך דף יצירת קשר.'
  },
  {
    q: 'איך מחושבת עלות המשלוח?',
    a: 'המשלוח מחושב כ-₪50 לכל 50 פריטים (מעוגל כלפי מעלה).' 
  },
  {
    q: 'האם העיצובים נשמרים בעגלת הקניות?',
    a: 'אנו שומרים תצוגת מקדמה (dataURL) כדי לשמר את המוקאפ. יש להעלות קבצים מקוריים שוב אם תרצו לשמור אותם בקבצי מקור.'
  },
  {
    q: 'מהי מדיניות ההחזרים?',
    a: 'החזרות והחלפות כפופות למדיניות האתר — מוצרים מותאמים אישית אינם ניתנים להחזרה ללא פגם ייצור.'
  },
  {
    q: 'אילו שיטות תשלום נתמכות?',
    a: 'כרטיסי אשראי, תשלום מקוון וחשבונית לחברות (בהתאם להסדר).' 
  },
  {
    q: 'איך ליצור קשר לתמיכה?',
    a: 'ניתן לפנות דרך טופס יצירת קשר בדף ההתקשרות או לשלוח מייל ל-support@printee.co.il' 
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
        <title>שאלות נפוצות – Printee</title>
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
        <div className="mt-8 text-center">
          <Link to="/contact" className="text-blue-600 underline">צרו קשר אם לא מצאתם תשובה</Link>
        </div>
      </div>
    </div>
  );
}
