import React, { useEffect, useState } from 'react';
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

export default function ThankYouCC() {
  const { payload, clearCart } = useCart();
  const [showRaw, setShowRaw] = useState(false);
  const [marked, setMarked] = useState(false);

  const orderId = safeGet(payload, 'order.id') || safeGet(payload, 'order_number') || safeGet(payload, 'id') || '';
  const customerName = safeGet(payload, 'customer.name') || safeGet(payload, 'contact.name') || safeGet(payload, 'contact?.name');

  // When returning from iCount, mark Airtable record as paid using idempotency key in query string
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const idem = params.get('idem');
      if (!idem || marked) return;
      const invrec = {};
      // iCount appends query params; sometimes the URL may contain both a placeholder (docnum={docnum})
      // and a real value later (docnum=6967). Prefer the last numeric docnum.
      const allDocnums = params.getAll('docnum');
      const lastNumericDoc = [...allDocnums].reverse().find((v) => /^\d+$/.test(String(v || '')));
      const docnum = lastNumericDoc || params.get('doc') || null;
      // iCount returns doc_url (invoice link). Fall back to older names if ever present.
      const link = params.get('doc_url') || params.get('invlink') || params.get('link') || null;
      if (docnum) invrec.docnum = docnum;
      if (link) invrec.link = link;
      const payload = { idempotency_key: idem, financial: { paid: true } };
      if (Object.keys(invrec).length > 0) payload.financial.invrec = invrec;
      // If we previously saved a dropbox shared link into the persistent payload, include it here
      try {
        const saved = JSON.parse(localStorage.getItem('order_payload') || '{}');
        const link = saved?.financial?.dropbox_shared_link;
        if (link) payload.financial.dropbox_shared_link = link;
      } catch (e) {}
      fetch('/api/airtable/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
  setMarked(true);
  try { clearCart(); } catch {}
    } catch {}
  }, [marked, clearCart]);

  // Fire Google Ads conversion event (AW) once per order
  useEffect(() => {
    try {
      const totals = safeGet(payload, 'order.totals') || safeGet(payload, 'cartSummary') || {};
      let value = Number(totals?.total || totals?.grandTotal || totals?.amount || 0) || 0;
      let currency = String(totals?.currency || 'ILS');
      let tx = String(orderId || payload?.idempotency_key || '');
      if ((!tx || !value) && typeof window !== 'undefined') {
        try {
          const s = JSON.parse(localStorage.getItem('order_payload_for_gtag') || '{}');
          if (s && s.transaction_id) tx = tx || String(s.transaction_id || '');
          if (!value && s && s.value) value = Number(s.value || 0);
          if (s && s.currency) currency = s.currency || currency;
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const key = `gtag_purchase_${tx}`;
        if (tx && localStorage.getItem(key)) return; // already fired
        window.gtag('event', 'conversion', {
          send_to: 'AW-17646508237/Oc12CLWH8asbEM2xwd5B',
          value: value,
          currency: currency,
          transaction_id: tx,
        });
        // GA4 purchase event (explicit)
        try {
          window.gtag('event', 'purchase', {
            transaction_id: tx,
            value: value,
            currency: currency,
            payment_type: 'cc',
          });
        } catch {}
        if (tx) localStorage.setItem(key, '1');
        try { localStorage.removeItem('order_payload_for_gtag'); } catch (e) {}
      }
    } catch (e) {}
  }, [orderId, payload]);

  // Ensure we clear the cart items when landing on the iCount thank-you page
  useEffect(() => {
    try { clearCart(); } catch (e) {}
  }, [clearCart]);

  return (
    <>
      <Helmet>
        <title>תודה — תשלום התקבל</title>
        <meta name="description" content="תשלום התקבל וההזמנה החלה בתהליך ייצור. קיבלת אישור במייל עם פרטי ההזמנה." />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">תשלום התקבל — ההזמנה הועברה לייצור</h1>
            <p className="text-lg text-gray-600 mb-6">תודה! התשלום אושר וההזמנה הועברה לתהליך הייצור. קיבלת אישור בפרטי ההזמנה במייל.</p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/catalog"><Button>המשך לקניות</Button></Link>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}
