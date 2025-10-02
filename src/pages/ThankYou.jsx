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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank you!</h1>
            <p className="text-lg text-gray-600 mb-6">We received your order. A confirmation email will be sent shortly and our team will contact you if we need anything else.</p>

            <div className="bg-white border rounded-lg p-4 text-left shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-3">Order summary</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div><strong>Order ID</strong><div className="text-xs text-gray-500">{orderId || '—'}</div></div>
                <div><strong>Customer</strong><div className="text-xs text-gray-500">{customerName || '—'}</div></div>
                <div><strong>Email</strong><div className="text-xs text-gray-500">{customerEmail || '—'}</div></div>
                <div><strong>Totals</strong><div className="text-xs text-gray-500">{totals && typeof totals === 'object' ? JSON.stringify(totals) : (totals || '—')}</div></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <Button onClick={() => setShowRaw(s => !s)} variant="outline">{showRaw ? 'Hide raw payload' : 'Show raw payload'}</Button>
              <Link to="/catalog"><Button>Continue shopping</Button></Link>
              <Button variant="ghost" onClick={() => { clearPayload(); }}>Clear local payload</Button>
            </div>

            {/* dev links removed from thank-you page; use /dev for developer tools */}

            {showRaw && (
              <div className="bg-gray-50 border rounded p-3 text-left">
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(payload || {}, null, 2)}</pre>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </>
  );
}
