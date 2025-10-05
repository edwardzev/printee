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

    // Try local proxy first; if it fails or is unavailable, fall back to direct sendOrderToPabbly
    try {
      const ctrl = new AbortController();
      // Allow more time for serverless cold starts and Dropbox uploads
      const timeout = setTimeout(() => ctrl.abort(), 12000);
      let proxied = false;
      try {
        const r = await fetch('/api/forward-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSend),
          signal: ctrl.signal
        });
        clearTimeout(timeout);
        if (r && r.ok) {
          proxied = true;
        } else {
          // if proxy returns non-ok, attempt fallback
          const txt = await r.text().catch(()=>'<no-body>');
          console.warn('Proxy forward failed', r.status, txt);
        }
      } catch (err) {
        // fetch aborted or network error -> fallback
        console.warn('Proxy forward error, falling back', err?.message || err);
      }

      if (!proxied) {
        // call direct Pabbly sender (has its own retries and client-side normalization)
        const res = await sendOrderToPabbly(toSend, { localTimeout: 12000 }).catch(e=>({ ok: false, error: e?.message || String(e) }));
        if (!res || !res.ok) {
          toast({ title: 'Webhook forwarding failed', description: res?.error || 'Unknown error', variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error('Forwarding error', err);
      toast({ title: 'Webhook error', description: err?.message || String(err), variant: 'destructive' });
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
          const blob = new Blob([JSON.stringify(toSend)], { type: 'application/json' });
          const ok = navigator.sendBeacon && navigator.sendBeacon('/api/forward-order', blob);
          if (!ok) fetch('/api/forward-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSend) }).catch(()=>{});
        } catch (e) { /* ignore */ }

        // ask server to create a short session for iCount
        const r = await fetch('/api/pay/icount-create-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSend) });
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
            throw new Error('Failed to post to payment forwarder');
          }
        } catch (err) {
          console.error('iCount submit error', err);
          toast({ title: 'שגיאת תשלום', description: err?.message || String(err), variant: 'destructive' });
          return;
        }
        return;
      } catch (err) {
        console.error('iCount session/create error', err);
        toast({ title: 'שגיאת תשלום', description: err?.message || String(err), variant: 'destructive' });
        return;
      }
    }

    if (method === 'bit') {
      toast({ title: 'העבר כספים ל-Bit' });
      // show phone for payment in a toast plus more persistent suggestion
      toast({ title: 'Bit / Paybox', description: 'העבירו ל: 054-696-9974. שלחו צילום אישור תשלום ל-info@printmarket.co.il' });
      // Best-effort background forward to server now that UX is unblocked
      try {
        const blob = new Blob([JSON.stringify({
          ...payload,
          cart: (Array.isArray(cartItems) ? sanitizedCart : []),
          contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          paymentMethod: method,
          cartSummary: cartSummary || {}
        })], { type: 'application/json' });
        navigator.sendBeacon && navigator.sendBeacon('/api/forward-order', blob);
      } catch (e) { /* ignore */ }
      // navigate to thank-you page so the user sees confirmation/next steps
      try { navigate('/thank-you'); } catch (e) { /* ignore */ }
      onClose();
      return;
    }

  // wire transfer or cheque
  toast({ title: 'תודה', description: 'נציגנו יצור איתך קשר בהקדם כדי להשלים את פרטי התשלום.' });
  // Fire-and-forget background forward as well
  try {
    const blob = new Blob([JSON.stringify({
      ...payload,
      cart: sanitizedCart,
      contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      paymentMethod: method,
      cartSummary: cartSummary || {}
    })], { type: 'application/json' });
    navigator.sendBeacon && navigator.sendBeacon('/api/forward-order', blob);
  } catch (e) { /* ignore */ }
  try { navigate('/thank-you'); } catch (e) { /* ignore */ }
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
          <Button onClick={handleConfirm} className="flex-1" disabled={!(name.trim() && phone.trim() && email.trim())}>{method === 'card' ? 'המשך ל-iCount' : method === 'bit' ? 'השלם תשלום ב-Bit' : 'שלח פרטי יצירת קשר'}</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </motion.div>
    </div>
  );
}
