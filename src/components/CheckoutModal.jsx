import React, { useState, useEffect, useRef } from 'react';
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
  // Keep a reference to the single background forward promise so we can await it before navigating to iCount
  const forwardPromiseRef = useRef(null);
  const idempotencyKeyRef = useRef((payload && payload.idempotency_key) || `local-${Date.now()}-${Math.random().toString(36).slice(2,9)}`);

  // Helper: send forward-order once per modal session/click using same idempotency key
  const sendForwardOrderOnce = async (fullPayload) => {
    // Reuse the same in-flight promise if already started
    if (forwardPromiseRef.current) return forwardPromiseRef.current;
    const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
  const minimal = { idempotency_key: idempotencyKeyRef.current, contact: fullPayload.contact, paymentMethod: fullPayload.paymentMethod, cartSummary: fullPayload.cartSummary || {}, _partial: true };
    try {
      // Fire a full payload fetch in the background and store the promise so callers can await if needed.
      // This includes uploadedDesigns urls (which may be data URLs) so the server can upload to Dropbox.
      forwardPromiseRef.current = fetch(forwardUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // help keep the request alive if the page navigates; browser may limit payload size for keepalive
        keepalive: true,
        credentials: 'same-origin',
        body: JSON.stringify({ ...fullPayload, idempotency_key: idempotencyKeyRef.current })
      })
        .then(async (r) => {
          // Try to consume response (may include debug info); ignore content errors
          try { await r.text(); } catch {}
          return r;
        })
        .catch((e) => {
          console.warn('forward-order fetch error', e?.message || e);
          throw e;
        });

      // Additionally, send a minimal beacon as a backup signal (idempotent on server side)
      try {
        if (navigator && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(minimal)], { type: 'application/json' });
          navigator.sendBeacon(forwardUrl, blob);
        }
      } catch {}
      return forwardPromiseRef.current;
    } catch (e) {
      console.warn('sendForwardOrderOnce failed', e?.message || e);
      return Promise.reject(e);
    }
  };

  useEffect(() => {
    if (open) {
      // Generate a fresh idempotency key for this checkout attempt to avoid reusing a previous order
      const newKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      idempotencyKeyRef.current = newKey;
      try { mergePayload({ idempotency_key: newKey }); } catch {}

      // Initialize form fields from the provided prefill snapshot when the modal opens.
      // Do NOT reset the chosen payment method on subsequent contact updates.
      setName(prefillContact?.name || '');
      setPhone(prefillContact?.phone || '');
      setEmail(prefillContact?.email || '');

      // Start partial forward early to begin uploads (no Pabbly forwarding yet)
      try {
        const forwardUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/api/forward-order` : '/api/forward-order';
        const basePayload = {
          ...payload,
          contact: { name: prefillContact?.name || payload?.contact?.name || '', phone: prefillContact?.phone || payload?.contact?.phone || '', email: prefillContact?.email || payload?.contact?.email || '' },
          paymentMethod: method,
          cartSummary: cartSummary || {},
          idempotency_key: idempotencyKeyRef.current,
          _partial: true
        };
        // Note: We intentionally do not await this. It primes Airtable and starts Dropbox uploads.
        fetch(forwardUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forward-partial': '1' }, body: JSON.stringify(basePayload) }).catch(()=>{});
      } catch {}
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

  // Build a sanitized cart (strip File objects) but preserve uploadedDesigns.url (which may contain data URLs)
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

  // Fire-and-forget forwarding: send full payload in background fetch (with beacon backup) so Dropbox uploads can occur
  setProcessing(true);
  try {
    // Idempotent background forward (will only run once per modal session)
    try {
      sendForwardOrderOnce(toSend).catch(()=>{});
    } catch (e) {
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

        // Ensure the full forward reaches the server before redirecting, up to a short timeout.
        // This greatly increases reliability that Pabbly receives the final payload.
        const waitWithTimeout = (p, ms) => {
          return new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => { if (!settled) resolve(null); }, ms);
            p.then((r) => { if (!settled) { settled = true; clearTimeout(timer); resolve(r); } })
             .catch(() => { if (!settled) { settled = true; clearTimeout(timer); resolve(null); } });
          });
        };
        try {
          await waitWithTimeout(sendForwardOrderOnce(toSend), 2500);
        } catch (e) { /* ignore */ }

        // ask server to create a short session for iCount
        // Build a minimal session payload to avoid large body uploads (data URLs, files, etc.)
        // IMPORTANT: Use the same total we display to the user (subtotal * 1.17 VAT)
        const grandTotal = Math.round((cartSummary?.total || 0) * 1.17);
        const sessionToSend = {
          idempotency_key: idempotencyKeyRef.current,
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
        // Build a concise description from cart items (first 2-3 names)
        const itemDescs = (sanitizedCart || []).slice(0, 3).map(i => `${(i?.product?.name || i?.name || 'פריט')}${i?.quantity ? ' x' + i.quantity : ''}`);
        const desc = itemDescs.length ? `הזמנה: ${itemDescs.join(', ')}${(sanitizedCart || []).length > 3 ? '…' : ''}` : 'הזמנה';

        const qs = new URLSearchParams({
          idempotency_key: sessionToSend.idempotency_key,
          grand_total: String(sessionToSend.order.totals.grand_total || 0),
          name: sessionToSend.contact.name || '',
          phone: sessionToSend.contact.phone || '',
          email: sessionToSend.contact.email || '',
          desc
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
        // Build a form targeting current tab; partial-forward already started on modal open
        const form = document.createElement('form');
        form.action = '/api/pay/icount';
        form.method = 'POST';
        form.target = '_self';
        form.style.display = 'none';
        // Append fields
        Object.entries(icountFields).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = typeof v === 'string' ? v : JSON.stringify(v);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        try {
          form.submit();
          // Inform user uploads continue while paying
          toast({ title: 'מעבר לתשלום', description: 'אנחנו מעלים את הקבצים ברקע בזמן התשלום.' });
        } finally {
          try { document.body.removeChild(form); } catch {}
        }
        setProcessing(false);
        onClose();
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
        sendForwardOrderOnce({ ...payload, cart: (Array.isArray(cartItems) ? sanitizedCart : []), contact: { name: name.trim(), phone: phone.trim(), email: email.trim() }, paymentMethod: method, cartSummary: cartSummary || {} }).catch(()=>{});
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
      sendForwardOrderOnce({ ...payload, cart: sanitizedCart, contact: { name: name.trim(), phone: phone.trim(), email: email.trim() }, paymentMethod: method, cartSummary: cartSummary || {} }).catch(()=>{});
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
