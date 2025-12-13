import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle.js';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';

function safeGet(obj, path, fallback = '') {
  try {
    return path.split('.').reduce((s, key) => (s && s[key] != null ? s[key] : null), obj) || fallback;
  } catch (e) {
    return fallback;
  }
}

export default function ThankYou() {
  const { payload, clearCart } = useCart();
  const [showRaw, setShowRaw] = useState(false);
  const [marked, setMarked] = useState(false);
  // no-op: bump for redeploy cache-bust
  const sentRef = useRef(false);
  const bitToastRef = useRef(null);
  const { toast } = useToast();

  // QA helper: allow clearing local duplicate guard via ?clear_gtag=1
  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      const clear = String(qp.get('clear_gtag') || '').toLowerCase() === '1';
      if (!clear) return;
      const toDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gtag_purchase_')) toDelete.push(k);
      }
      toDelete.forEach((k) => { try { localStorage.removeItem(k); } catch (_) {} });
      try { localStorage.removeItem('order_payload_for_gtag'); } catch (_) {}
      console.info('[gtag] cleared duplicate guards via clear_gtag=1');
    } catch (_) {}
  }, []);

  const orderId = safeGet(payload, 'order.id') || safeGet(payload, 'order_number') || safeGet(payload, 'id') || '';
  const customerName = safeGet(payload, 'customer.name') || safeGet(payload, 'contact.name') || safeGet(payload, 'contact?.name');
  const customerEmail = safeGet(payload, 'customer.email') || safeGet(payload, 'contact.email');
  const totals = safeGet(payload, 'order.totals') || safeGet(payload, 'cartSummary') || {};
  const paymentMethod = String(payload?.paymentMethod || payload?.financial?.payment_method || '').toLowerCase();
  const isBitPayment = paymentMethod === 'bit';

  useEffect(() => {
    if (!isBitPayment) {
      if (bitToastRef.current) {
        try { bitToastRef.current.dismiss?.(); } catch (_) {}
        bitToastRef.current = null;
      }
      return undefined;
    }
    const nextToast = toast({
      title: 'Bit / Paybox',
      description: 'העבירו לאמצעי התשלום: 054-696-9974 ושלחו צילום אישור ל-info@printmarket.co.il',
      duration: Infinity,
    });
    bitToastRef.current = nextToast;
    return () => {
      try { nextToast?.dismiss?.(); } catch (_) {}
      bitToastRef.current = null;
    };
  }, [isBitPayment, toast]);

  // Fire Google Ads conversion event (AW) once per order
  useEffect(() => {
    try {
      let value = Number(totals?.total || totals?.grandTotal || totals?.amount || 0) || 0;
      let currency = String(totals?.currency || 'ILS');
      let tx = String(orderId || payload?.idempotency_key || '');
      // fallback to stored payload (survives external redirect)
      if ((!tx || !value) && typeof window !== 'undefined') {
        try {
          const s = JSON.parse(localStorage.getItem('order_payload_for_gtag') || '{}');
          if (s && s.transaction_id) tx = tx || String(s.transaction_id || '');
          if (!value && s && s.value) value = Number(s.value || 0);
          if (s && s.currency) currency = s.currency || currency;
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && typeof window.gtag === 'function' && !sentRef.current) {
        // Generate a resilient fallback transaction id to avoid empty IDs
        if (!tx) tx = String(payload?.idempotency_key || `tmp_${Date.now()}`);
        const key = tx ? `gtag_purchase_${tx}` : '';
        const debugBypass = String(new URLSearchParams(window.location.search).get('debug_gtag') || '').toLowerCase() === '1';
        // TTL-based suppression: 72 hours
        const isSuppressed = () => {
          if (!tx || !key) return false;
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            // Support legacy '1' values (no TTL) as suppressed
            let t = null;
            try { const obj = JSON.parse(raw); t = obj && obj.t ? Number(obj.t) : null; } catch {}
            if (!t) return true;
            const ttlMs = 72 * 60 * 60 * 1000;
            if (Date.now() - t < ttlMs) return true;
            try { localStorage.removeItem(key); } catch {}
            return false;
          } catch { return false; }
        };
        if (!debugBypass && isSuppressed()) { console.info('[gtag] suppressed duplicate for tx', tx); return; }
        const fire = () => {
          if (sentRef.current) return;
          try {
            console.info('[gtag] purchase firing', { tx, value, currency, page: 'thank-you' });
            window.gtag('event', 'conversion', {
              send_to: 'AW-17646508237/Oc12CLWH8asbEM2xwd5B',
              value: value,
              currency: currency,
              transaction_id: tx,
            });
            window.gtag('event', 'purchase', {
              transaction_id: tx,
              value: value,
              currency: currency,
              payment_type: 'standard',
              debug_mode: debugBypass || undefined,
              items: [
                {
                  item_id: 'order',
                  item_name: 'Custom apparel order',
                  quantity: 1,
                },
              ],
            });
            if (tx && key) try { localStorage.setItem(key, JSON.stringify({ t: Date.now() })); } catch {}
            try { localStorage.removeItem('order_payload_for_gtag'); } catch (e) {}
            // Clear cart only after we fired analytics to avoid racing payload resets
            try { clearCart(); } catch (e) {}
            sentRef.current = true;
          } catch (e) {}
        };
        // Small delay to ensure Tag Assistant hooks and any late payload resolves
        setTimeout(fire, 300);
      }
    } catch (e) {}
  }, [orderId, totals, payload]);

  // When returning from iCount, mark Airtable record as paid using idempotency key in query string
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const idem = params.get('idem');
      if (!idem || marked) return;
      const invrec = {};
      const docnum = params.get('docnum') || params.get('doc') || null;
      const link = params.get('invlink') || params.get('link') || null;
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
    } catch {}
  }, [marked, clearCart]);

  // Cart clearing moved to fire callback above to avoid racing with analytics

  return (
    <>
      <Helmet>
        <title>תודה - Printeam</title>
        <link rel="canonical" href="https://printeam.co.il/thank-you" />
        <meta name="description" content="תודה על הזמנתך. פרטי האישור והשלבים הבאים יישלחו אליך במייל." />
      </Helmet>

      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">תודה רבה!</h1>
            <p className="text-lg text-gray-600 mb-6">ההזמנה נקלטה בהצלחה. נשלח אליך אישור במייל בקרוב והצוות שלנו ייצור איתך קשר להמשך התהליך.</p>

            {/* Summary removed per request */}

            <div className="flex items-center justify-center gap-3 mb-6">
              <Link to="/catalog"><Button>המשך לקניות</Button></Link>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}
