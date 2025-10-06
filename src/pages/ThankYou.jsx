import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

function safeGet(obj, path, fallback = '') {
  try {
    return path.split('.').reduce((s, key) => (s && s[key] != null ? s[key] : null), obj) || fallback;
  } catch (e) {
    return fallback;
  }
}

export default function ThankYou() {
  const { payload, clearPayload } = useCart();
  const [showRaw, setShowRaw] = useState(false);

  const orderId = safeGet(payload, 'order.id') || safeGet(payload, 'order_number') || safeGet(payload, 'id') || '';
  const customerName = safeGet(payload, 'customer.name') || safeGet(payload, 'contact.name') || safeGet(payload, 'contact?.name');
  const customerEmail = safeGet(payload, 'customer.email') || safeGet(payload, 'contact.email');
  const totals = safeGet(payload, 'order.totals') || safeGet(payload, 'cartSummary') || {};

  return (
    <>
      <Helmet>
        <title>Thank you - Print Market</title>
        <meta name="description" content="Thanks for your order. We'll be in touch with next steps." />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">תודה רבה!</h1>
            <p className="text-lg text-gray-600 mb-6">ההזמנה נקלטה בהצלחה. נשלח אליך אישור במייל בקרוב והצוות שלנו ייצור איתך קשר במידה ונצטרך פרטים נוספים.</p>

            <div className="bg-white border rounded-lg p-4 text-left shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-3">סיכום הזמנה</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div><strong>מספר הזמנה</strong><div className="text-xs text-gray-500">{orderId || '—'}</div></div>
                <div><strong>שם</strong><div className="text-xs text-gray-500">{customerName || '—'}</div></div>
                <div><strong>אימייל</strong><div className="text-xs text-gray-500">{customerEmail || '—'}</div></div>
                <div><strong>סכום</strong><div className="text-xs text-gray-500">{totals && typeof totals === 'object' ? JSON.stringify(totals) : (totals || '—')}</div></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/catalog"><Button>המשך לקניות</Button></Link>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}
