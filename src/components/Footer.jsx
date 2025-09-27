import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Print Market</h3>
            <p className="text-gray-300 mb-4">
              {t('company')}
            </p>
            <p className="text-sm text-gray-400">
              © 2024 {t('allRightsReserved')}
            </p>
          </div>

          {/* Legal & Links in Hebrew */}
          <div>
            <h4 className="text-lg font-semibold mb-4">מידע משפטי ושירות</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <Link to="/terms" className="block hover:text-white transition-colors">
                  <strong>תנאי שימוש</strong>
                  <p className="text-sm text-gray-400">תיאור קצר: תנאי השימוש מסבירים את זכויות המשתמש, הגבלות השימוש באתר ותהליך ההזמנה.</p>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="block hover:text-white transition-colors">
                  <strong>מדיניות פרטיות</strong>
                  <p className="text-sm text-gray-400">תיאור קצר: כיצד אנו אוספים, משתמשים ומשמרים מידע אישי ושימוש בעוגיות.</p>
                </Link>
              </li>
              <li>
                <Link to="/returns" className="block hover:text-white transition-colors">
                  <strong>החזרות והחלפות</strong>
                  <p className="text-sm text-gray-400">תיאור קצר: תנאי החזרה, מתי ניתן להחזיר מוצרים ואופן יצירת קשר להחזרות והחלפות.</p>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">צור קשר</h4>
            <div className="text-gray-300 space-y-2">
              <p>info@printmarket.co.il</p>
              <p>+972-50-123-4567</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;