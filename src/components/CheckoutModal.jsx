import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
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

  // Backend removed: no forwarding; only local state and client-side UX remain.

  useEffect(() => {
    if (open) {
      // Ensure we have an idempotency key, but don't overwrite if one already exists (Cart ensured this earlier)
      const existing = payload && payload.idempotency_key;
      if (existing) {
        idempotencyKeyRef.current = existing;
      } else {
        const newKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        idempotencyKeyRef.current = newKey;
        try { mergePayload({ idempotency_key: newKey }); } catch {}
      }

      // Initialize form fields from the provided prefill snapshot when the modal opens.
      // Do NOT reset the chosen payment method on subsequent contact updates.
      setName(prefillContact?.name || '');
      setPhone(prefillContact?.phone || '');
      setEmail(prefillContact?.email || '');

      // Backend removed: no partial forward.
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
      // Provide totals to satisfy backend validation; keep currency simple for now
      totals: {
        subtotal: Number(cartSummary?.subtotal || 0),
        total: Number(cartSummary?.total || 0),
        currency: 'ILS',
      },
    };

  setProcessing(true);

    // Fire-and-forget order POST; prefer sendBeacon to avoid abort on navigation, fallback to fetch
    try {
      const json = JSON.stringify(toSend);
      let sent = false;
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([json], { type: 'application/json' });
        sent = navigator.sendBeacon('/api/order', blob);
      }
      if (!sent) {
        // do not await; avoid blocking UI
        fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) {}

    // Enrich Airtable record with Customer + Financial + Cart and attach file paths.
    try {
      // Recreate the same uploads we generated in Cart for naming consistency
      const uploads = (() => {
        try {
          const list = [];
          (cartItems || []).forEach((item) => {
            const product = item.productSku || item.product || 'product';
            const matrices = item.sizeMatrices || {};
            const colors = item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length
              ? item.selectedColors
              : (item.color ? [item.color] : []);
            const activeColors = [];
            let totalQtyForItem = 0;
            colors.forEach((c) => {
              const mat = (matrices && matrices[c]) || (c === item.color ? (item.sizeMatrix || {}) : {});
              const qty = Object.values(mat || {}).reduce((s, q) => s + (q || 0), 0);
              if (qty > 0) { activeColors.push(c); totalQtyForItem += qty; }
            });
            if (activeColors.length === 0) return;
            const areaMethod = {};
            (item.selectedPrintAreas || []).forEach((sel) => {
              if (!sel) return;
              if (typeof sel === 'string') areaMethod[sel] = 'print';
              else if (sel.areaKey) areaMethod[sel.areaKey] = sel.method || 'print';
            });
            const designs = item.uploadedDesigns || {};
            Object.keys(designs).forEach((areaKey) => {
              const d = designs[areaKey];
              if (!d || !d.url) return;
              const method = areaMethod[areaKey] || 'print';
              const fileName = d.name || `${areaKey}.png`;
              list.push({ areaKey, method, product, colors: activeColors, qty: totalQtyForItem, dataUrl: d.url, fileName });
            });
          });
          return list;
        } catch (e) { return []; }
      })();

      const financialBlock = {
        subtotal: Number(cartSummary?.total || 0), // garments + prints total before VAT and delivery
        delivery: Number((payload?.withDelivery ? (Math.ceil((cartSummary?.totalItems || 0) / 50) * 50) : 0) || 0),
        vat: Math.round(Number(cartSummary?.total || 0) * 0.17),
        total: Math.round(Number(cartSummary?.total || 0) * 1.17 + Number((payload?.withDelivery ? (Math.ceil((cartSummary?.totalItems || 0) / 50) * 50) : 0) || 0)),
        payment_method: method,
      };

      const enriched = {
        idempotency_key: idempotencyKeyRef.current,
        customer: { name, phone, email, address_street: payload?.contact?.address_street || '', address_city: payload?.contact?.address_city || '' },
        financial: financialBlock,
        cart: {
          items: (cartItems || []).map((i) => ({
            productSku: i.productSku,
            productName: i.productName,
            color: i.color,
            selectedColors: i.selectedColors,
            sizeMatrix: i.sizeMatrix,
            sizeMatrices: i.sizeMatrices,
            selectedPrintAreas: i.selectedPrintAreas,
          })),
        },
        cartUploads: uploads,
      };

      fetch('/api/airtable/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched),
      }).catch(() => {});
    } catch (_) {}


    if (method === 'card') {
      // Backend removed: show thank-you page with client-only confirmation.
      toast({ title: 'תודה', description: 'הזמנה התקבלה. ניצור קשר להמשך.', variant: 'default' });
      try { navigate('/thank-you'); } catch (e) { /* ignore */ }
      setProcessing(false);
      onClose();
      return;
    }

    if (method === 'bit') {
      toast({ title: 'העבר כספים ל-Bit' });
      // show phone for payment in a toast plus more persistent suggestion
      toast({ title: 'Bit / Paybox', description: 'העבירו ל: 054-696-9974. שלחו צילום אישור תשלום ל-info@printmarket.co.il' });
      // Backend removed: no background forward
      // navigate to thank-you page so the user sees confirmation/next steps
      try { navigate('/thank-you'); } catch (e) { /* ignore */ }
      setProcessing(false);
      onClose();
      return;
    }

  // wire transfer or cheque
  toast({ title: 'תודה', description: 'נציגנו יצור איתך קשר בהקדם כדי להשלים את פרטי התשלום.' });
  // Fire-and-forget background forward as well
    // Backend removed: no background forward
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
