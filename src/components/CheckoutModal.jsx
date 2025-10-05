import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { sendOrderToPabbly } from '@/api/EcommerceApi';
import { CreditCard, Smartphone, Banknote, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutModal({ open, onClose, cartSummary, prefillContact }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { mergePayload, payload, cartItems } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [name, setName] = useState(prefillContact?.name || '');
  const [phone, setPhone] = useState(prefillContact?.phone || '');
  const [email, setEmail] = useState(prefillContact?.email || '');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      // Initialize form fields from the provided prefill snapshot when the modal opens.
      // Do NOT reset the chosen payment method on subsequent contact updates.
      setName(prefillContact?.name || '');
      setPhone(prefillContact?.phone || '');
      setEmail(prefillContact?.email || '');
    }
  }, [open]);

  if (!open) return null;

  const totalWithVat = Math.round((cartSummary?.total || 0) * 1.17).toLocaleString();

  const requireContact = (m) => {
    // require contact for card, bit, wire, cheque per request
    return ['card', 'bit', 'wire', 'cheque'].includes(m);
  };

  const handleConfirm = async () => {
    if (requireContact(method) && (!name.trim() || !phone.trim() || !email.trim())) {
      toast({ title: 'אנא מלא/י שם, טלפון ואימייל' , variant: 'destructive'});
      return;
    }

    // Merge contact + payment method into shared payload
    try {
      mergePayload({ contact: { name: name.trim(), phone: phone.trim(), email: email.trim() }, paymentMethod: method });
    } catch (err) {
      // ignore
    }

    // Forward to Pabbly webhook (best-effort). Include cart payload and contact/payment info.
    // Build a sanitized cart (strip File objects) to avoid serialization issues.
    const sanitizedCart = (Array.isArray(cartItems) ? cartItems : []).map((i) => {
      const { uploadedDesigns, ...rest } = i || {};
      const sanitizedDesigns = {};
      if (uploadedDesigns && typeof uploadedDesigns === 'object') {
        for (const key in uploadedDesigns) {
          const { file, ...restOfDesign } = uploadedDesigns[key] || {};
          const preserved = {};
          if (restOfDesign && restOfDesign.url) preserved.url = restOfDesign.url;
          if (restOfDesign && restOfDesign.name) preserved.name = restOfDesign.name;
          sanitizedDesigns[key] = preserved;
        }
      }
      return { ...rest, uploadedDesigns: sanitizedDesigns };
    });

    const toSend = {
      ...payload,
      cart: sanitizedCart,
      contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      paymentMethod: method,
      cartSummary: cartSummary || {}
    };

  // Fire-and-forget forwarding: prefer sendBeacon, fallback to a short fetch so UI doesn't hang
  setProcessing(true);
  try {
      try {
        if (navigator && navigator.sendBeacon) {
          // Use absolute origin to avoid relative path issues across environments
          const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
          // Keep beacon payload minimal to avoid size limits
          const beaconPayload = JSON.stringify({ idempotency_key: toSend.idempotency_key || (toSend.order && toSend.order.order_id) || `local-${Date.now()}`, contact: toSend.contact, paymentMethod: toSend.paymentMethod, cartSummary: toSend.cartSummary || {} });
          const blob = new Blob([beaconPayload], { type: 'application/json' });
          const ok = navigator.sendBeacon(forwardUrl, blob);
          if (ok) {
            // sent via beacon, nothing more to do
          } else {
            // fallback to short fetch
            await fetch(forwardUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSend) }).catch(()=>{});
          }
        } else {
          // no beacon available, short fetch with timeout
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 4000);
          const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
          await fetch(forwardUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSend), signal: controller.signal }).catch(()=>{});
          clearTimeout(id);
        }
      } catch (e) {
        // swallow any errors so the payment UX isn't blocked
        console.warn('forward-order background forwarding failed', e?.message || e);
      }
    } catch (err) {
      console.error('Forwarding error', err);
    }

    if (method === 'card') {
      // For card: create an iCount payment session on the server, then open iCount page with minimal fields.
      try {
        const toSend = {
          ...payload,
          cart: sanitizedCart,
          contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          paymentMethod: method,
          cartSummary: cartSummary || {}
        };

        // best-effort forward as beacon
        try {
          const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
          const beaconPayload = JSON.stringify({ idempotency_key: toSend.idempotency_key || (toSend.order && toSend.order.order_id) || `local-${Date.now()}`, contact: toSend.contact, paymentMethod: toSend.paymentMethod, cartSummary: toSend.cartSummary || {} });
          const blob = new Blob([beaconPayload], { type: 'application/json' });
            const ok = navigator.sendBeacon && navigator.sendBeacon(forwardUrl, blob);
            if (!ok) fetch(forwardUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSend) }).catch(()=>{});
        } catch (e) { /* ignore */ }

        // ask server to create a short session for iCount
        // Build a minimal session payload to avoid large body uploads (data URLs, files, etc.)
        const grandTotal = (payload && payload.order && payload.order.totals && payload.order.totals.grand_total) || (cartSummary && cartSummary.total) || 0;
        const sessionToSend = {
          idempotency_key: payload?.idempotency_key || payload?.order?.order_id || `local-${Date.now()}`,
          order: { totals: { grand_total: Math.round(grandTotal) } },
          contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          paymentMethod: method,
          // include a small cart summary only (no uploadedDesigns or heavy fields)
          cartSummary: cartSummary || {}
        };

        // small fetch-with-timeout helper
        const fetchWithTimeout = (url, opts = {}, ms = 8000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), ms);
          const finalOpts = { ...opts, signal: controller.signal };
          return fetch(url, finalOpts).finally(() => clearTimeout(id));
        };

        // Use GET with small query params to avoid server/body size limits that caused 413
        const qs = new URLSearchParams({
          idempotency_key: sessionToSend.idempotency_key,
          grand_total: String(sessionToSend.order.totals.grand_total || 0),
          name: sessionToSend.contact.name || '',
          phone: sessionToSend.contact.phone || '',
          email: sessionToSend.contact.email || ''
        }).toString();
        const r = await fetchWithTimeout(`/api/pay/icount-create-session?${qs}`, { method: 'GET' }, 10000);
          if (r.status === 413) {
          // Payload too large — likely due to data URLs or large design objects still being sent.
          toast({ title: '\u05ea\u05e9\u05dc\u05d4', description: 'יצירת סשן נכשלה: הגוף נרחב מדי. נסו שוב ללא קבצים/עיצובים מוטבעים או רעננו את הדף.', variant: 'destructive' });
          console.error('icount-create-session returned 413 Payload Too Large');
            setProcessing(false);
            return;
        }
        const json = await r.json().catch(()=>null);
        if (!r.ok || !json || !json.ok) {
          throw new Error((json && json.error) || `Create session failed ${r.status}`);
        }

        const icountFields = (json.icount || {});
        // Build post target; allow overriding via env var exposed to client if available, otherwise fallback to icount host
        const ICOUNT_URL = (window?.ICOUNT_URL) || '/pay/icount';

        // Open new tab and post to iCount
        // Submit to our forwarding endpoint which returns an auto-submit HTML that posts to iCount in the current tab
        try {
          // POST to our /api/pay/icount which turns into an auto-submitting form to iCount
          const r2 = await fetch('/api/pay/icount', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(icountFields) });
          const html = await r2.text().catch(()=>null);
          if (r2.ok && html) {
            // Replace current document so navigation stays in a single tab
            document.open(); document.write(html); document.close();
            // on successful iCount flow the user will be redirected back to /thank-you/icount -> /thank-you
          } else {
            const bodyText = html || '<no-body>';
            console.error('Payment forwarder returned non-ok', r2.status, bodyText);
            toast({ title: 'שגיאת תשלום', description: `Forwarder error ${r2.status}: ${bodyText.slice(0,120)}`, variant: 'destructive' });
            throw new Error(`Failed to post to payment forwarder: ${r2.status}`);
          }
        } catch (err) {
          console.error('iCount submit error', err);
          toast({ title: 'שגיאת תשלום', description: err?.message || String(err), variant: 'destructive' });
          setProcessing(false);
          return;
        }
        return;
      } catch (err) {
        console.error('iCount session/create error', err);
        toast({ title: 'שגיאת תשלום', description: err?.message || String(err), variant: 'destructive' });
        setProcessing(false);
        return;
      }
    }

    if (method === 'bit') {
      toast({ title: 'העבר כספים ל-Bit' });
      // show phone for payment in a toast plus more persistent suggestion
      toast({ title: 'Bit / Paybox', description: 'העבירו ל: 054-696-9974. שלחו צילום אישור תשלום ל-info@printmarket.co.il' });
      // Best-effort background forward to server now that UX is unblocked
      try {
        try {
          const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
          const beaconPayload = JSON.stringify({ idempotency_key: payload?.idempotency_key || (payload?.order && payload.order.order_id) || `local-${Date.now()}`, contact: { name: name.trim(), phone: phone.trim(), email: email.trim() }, paymentMethod: method, cartSummary: cartSummary || {} });
          const blob = new Blob([beaconPayload], { type: 'application/json' });
          navigator.sendBeacon && navigator.sendBeacon(forwardUrl, blob);
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
      // navigate to thank-you page so the user sees confirmation/next steps
      try { navigate('/thank-you'); } catch (e) { /* ignore */ }
      setProcessing(false);
      onClose();
      return;
    }

  // wire transfer or cheque
  toast({ title: 'תודה', description: 'נציגנו יצור איתך קשר בהקדם כדי להשלים את פרטי התשלום.' });
  // Fire-and-forget background forward as well
    try {
      const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
    const blob = new Blob([JSON.stringify({ idempotency_key: payload?.idempotency_key || (payload?.order && payload.order.order_id) || `local-${Date.now()}`, contact: { name: name.trim(), phone: phone.trim(), email: email.trim() }, paymentMethod: method, cartSummary: cartSummary || {} })], { type: 'application/json' });
    navigator.sendBeacon && navigator.sendBeacon(forwardUrl, blob);
  } catch (e) { /* ignore */ }
  try { navigate('/thank-you'); } catch (e) { /* ignore */ }
  setProcessing(false);
  onClose();
  };

  const methodCards = [
    { id: 'card', label: 'כרטיס אשראי (iCount)', icon: CreditCard },
    { id: 'bit', label: 'Bit / Paybox', icon: Smartphone },
    { id: 'wire', label: 'העברה בנקאית', icon: Banknote },
    { id: 'cheque', label: 'שיק', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-60">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute right-6 top-16 w-[480px] max-w-[95%] bg-white rounded-2xl p-6 shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">אמצעי תשלום</h2>
          <div className="text-sm text-gray-500">סה"כ: ₪{totalWithVat}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {methodCards.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMethod(id)}
              className={`flex items-center gap-3 p-3 rounded-lg border ${method === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} text-sm`}
            >
              <div className={`p-2 rounded-md ${method === id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <Icon size={18} />
              </div>
              <div className="text-right flex-1">
                <div className="font-medium">{label}</div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span>שם מלא <span className="text-red-500">*</span></span>
            <input
              aria-required
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={name}
              onChange={(e) => { setName(e.target.value); try { mergePayload({ contact: { ...(payload?.contact || {}), name: e.target.value } }); } catch (er) {} }}
              placeholder="שם מלא"
            />
          </label>

          <label className="block text-sm">
            <span>טלפון <span className="text-red-500">*</span></span>
            <input
              aria-required
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); try { mergePayload({ contact: { ...(payload?.contact || {}), phone: e.target.value } }); } catch (er) {} }}
              placeholder="טלפון"
            />
          </label>

          <label className="block text-sm">
            <span>אימייל <span className="text-red-500">*</span></span>
            <input
              aria-required
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={email}
              onChange={(e) => { setEmail(e.target.value); try { mergePayload({ contact: { ...(payload?.contact || {}), email: e.target.value } }); } catch (er) {} }}
              placeholder="אימייל"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <Button onClick={handleConfirm} className="flex-1" disabled={processing || !(name.trim() && phone.trim() && email.trim())}>{method === 'card' ? 'המשך ל-iCount' : method === 'bit' ? 'השלם תשלום ב-Bit' : 'שלח פרטי יצירת קשר'}</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </motion.div>
      {processing && (
        <div className="absolute inset-0 z-70 flex items-center justify-center">
          <div className="bg-black/40 absolute inset-0" />
          <div className="relative z-80 flex items-center gap-4 bg-white/95 rounded-lg p-4 shadow">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium">שולח ומעבד את התשלום…</div>
          </div>
        </div>
      )}
    </div>
  );
}
