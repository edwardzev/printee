import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card.js';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone.js';
import Banknote from 'lucide-react/dist/esm/icons/banknote.js';
import FileText from 'lucide-react/dist/esm/icons/file-text.js';
import { useNavigate } from 'react-router-dom';
import { composeMockupImage } from '@/lib/composeMockupImage';
import { composeWorksheetImage } from '@/lib/composeWorksheetImage';
import { deriveDiscountedPricing, DEFAULT_DISCOUNT_RATE } from '@/lib/discountHelpers';
// Lazy import for PDF generation to avoid bundle bloat when not needed
let pdfLibPromise = null;
async function ensurePdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import('pdf-lib');
  }
  return pdfLibPromise;
}
async function pngsToPdf(pngDataUrls, opts = {}) {
  const { widthPx = 1240, heightPx = 1754 } = opts;
  const { PDFDocument } = await ensurePdfLib();
  const pdfDoc = await PDFDocument.create();
  for (const dataUrl of pngDataUrls) {
    if (!dataUrl) continue;
    const res = await fetch(dataUrl);
    const pngBytes = await res.arrayBuffer();
    const image = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([widthPx, heightPx]);
    page.drawImage(image, { x: 0, y: 0, width: widthPx, height: heightPx });
  }
  // Use pdf-lib's helper to produce a proper data URI to avoid manual btoa issues with large payloads
  const dataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  return dataUri;
}

export default function CheckoutModal({ open, onClose, cartSummary, prefillContact }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { mergePayload, payload, cartItems, getTotalItems } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [name, setName] = useState(prefillContact?.name || '');
  const [phone, setPhone] = useState(prefillContact?.phone || '');
  const [email, setEmail] = useState(prefillContact?.email || '');
  const [processing, setProcessing] = useState(false);
  const discountClaimed = (() => {
    if (payload?.discountClaimed) return true;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem('printee:discount-claimed') === 'true';
      }
    } catch (err) {
      // ignore storage access failures
    }
    return false;
  })();
  // Keep a reference to the single background forward promise so we can await it before navigating to iCount
  const forwardPromiseRef = useRef(null);
  const idempotencyKeyRef = useRef((payload && payload.idempotency_key) || `local-${Date.now()}-${Math.random().toString(36).slice(2,9)}`);
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const currencyFormatter = useMemo(() => {
    const locale = language === 'he' ? 'he-IL' : 'en-IL';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat('en-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }, [language]);

  const formatCurrency = useCallback((value) => {
    const num = Number(value);
    const safe = Number.isFinite(num) ? num : 0;
    try {
      return currencyFormatter.format(safe);
    } catch {
      return `₪${safe.toFixed(2)}`;
    }
  }, [currencyFormatter]);

  // Focus management: when modal opens, save previously focused element and move
  // focus into the dialog. When it closes, restore focus.
  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    // Move focus into the dialog container after render
    const timer = setTimeout(() => {
      try {
        // Prefer the first focusable element inside the dialog
        const root = dialogRef.current;
        if (!root) return;
        const focusable = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable && focusable.length) {
          (focusable[0]).focus();
        } else {
          root.focus();
        }
      } catch (e) { /* ignore */ }
    }, 0);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        try { onClose(); } catch (_) {}
      }
      // Simple focus trap: if Tab pressed, ensure focus remains inside dialog
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusable = Array.from(root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
          .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    // mark background inert via aria-hidden on root app container if available
    const appRoot = document.querySelector('#root') || document.body;
    const prevAria = appRoot.getAttribute && appRoot.getAttribute('aria-hidden');
    try { appRoot.setAttribute('aria-hidden', 'true'); } catch (e) {}

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      try {
        if (previouslyFocused.current && previouslyFocused.current.focus) previouslyFocused.current.focus();
      } catch (e) {}
      try {
        if (prevAria === null) appRoot.removeAttribute('aria-hidden'); else appRoot.setAttribute('aria-hidden', prevAria);
      } catch (e) {}
    };
  }, [open]);

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

  const subtotalBeforeDiscount = Number(cartSummary?.subtotal || 0);
  const subtotalAfterDiscount = Number(cartSummary?.total || 0);
  const discountAmount = Number(
    cartSummary?.discount ??
    (subtotalBeforeDiscount > subtotalAfterDiscount ? subtotalBeforeDiscount - subtotalAfterDiscount : 0)
  );
  const firstItemDiscountRate = cartItems?.find((item) => typeof item?.discountRate === 'number')?.discountRate;
  const inferredDiscountRate = discountAmount > 0 && subtotalBeforeDiscount > 0
    ? discountAmount / subtotalBeforeDiscount
    : (typeof firstItemDiscountRate === 'number' ? firstItemDiscountRate : DEFAULT_DISCOUNT_RATE);
  const discountRatePercent = Math.round((inferredDiscountRate || 0) * 100);
  const totalItemsCount = typeof getTotalItems === 'function' ? Number(getTotalItems() || 0) : 0;
  const deliveryCost = payload?.withDelivery ? Math.ceil(totalItemsCount / 50) * 50 : 0;
  const vatBase = subtotalAfterDiscount + deliveryCost;
  const vatAmount = Math.round(vatBase * 0.17);
  const baseTotal = vatBase + vatAmount;
  const cardDiscount = method === 'card' ? Math.round(baseTotal * 0.03) : 0;
  const paymentTotal = baseTotal - cardDiscount;
  const totalWithVat = formatCurrency(paymentTotal);

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
      const derived = deriveDiscountedPricing(i, { discountClaimed, defaultRate: DEFAULT_DISCOUNT_RATE });
      const effectiveDiscountRate = derived.discountApplied ? (derived.discountRate || DEFAULT_DISCOUNT_RATE) : 0;
      return {
        ...rest,
        totalPrice: derived.subtotalAfter,
        subtotalAfterDiscount: derived.subtotalAfter,
        subtotalBeforeDiscount: derived.subtotalBefore,
        totalBeforeDiscount: derived.subtotalBefore,
        discountAmount: derived.discountAmount,
        discountRate: effectiveDiscountRate,
        discountClaimed: derived.discountApplied || rest?.discountClaimed || discountClaimed,
        priceBreakdown: {
          ...(rest?.priceBreakdown || {}),
          discountAmount: derived.discountAmount,
          discountRate: effectiveDiscountRate,
          subtotalAfterDiscount: derived.subtotalAfter,
          totalBeforeDiscount: derived.subtotalBefore,
          totalAfterDiscount: derived.subtotalAfter,
          merchandiseTotal: derived.subtotalBefore,
        },
        uploadedDesigns: sanitizedDesigns,
      };
    });

    const toSend = {
      ...payload,
      cart: sanitizedCart,
      contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      paymentMethod: method,
      // Provide totals to satisfy backend validation; keep currency simple for now
      totals: {
        subtotal: subtotalBeforeDiscount,
        discount: discountAmount,
        total: subtotalAfterDiscount,
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
      // First: upsert order in Airtable to get orderId and (optionally) a Dropbox link
      let orderIdFromAirtable = payload?.airtable_order_id || '';
      let dropboxSharedLink = payload?.financial?.dropbox_shared_link || '';

      const subtotal0 = subtotalAfterDiscount;
      const delivery0 = deliveryCost;
      const vat0 = vatAmount;
      const total0 = baseTotal;

      try {
        const googleAds = payload?.tracking?.googleAds || {};
        const trackingMetadata = payload?.tracking?.metadata || {};
        const gclidValue = googleAds.gclid || '';
        const campaignValue = googleAds.campaign || '';
        const searchValue = googleAds.keyword || '';
        const deviceValue = trackingMetadata.device || '';
        const prelim = await fetch('/api/airtable/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotency_key: idempotencyKeyRef.current,
            gclid: gclidValue,
            campaign: campaignValue,
            search: searchValue,
            device: deviceValue,
            customer: {
              name,
              phone,
              email,
              address_street: payload?.contact?.street || payload?.contact?.address_street || '',
              address_city: payload?.contact?.city || payload?.contact?.address_city || '',
            },
            financial: { subtotal: subtotal0, delivery: delivery0, vat: vat0, total: total0, payment_method: method },
            cart: {
              items: (cartItems || []).map((i) => ({
                productSku: i.productSku,
                productName: i.productName,
                sizeMatrices: (i.sizeMatrices && typeof i.sizeMatrices === 'object') ? i.sizeMatrices : (i.color ? { [i.color]: (i.sizeMatrix || {}) } : {}),
                selectedPrintAreas: (i.selectedPrintAreas || []).map((sel) => typeof sel === 'string' ? { areaKey: sel, method: 'print' } : sel).filter(Boolean),
              })),
            },
            uploads: [],
            cartUploads: [],
          }),
        });
        const prelimJson = await prelim.json().catch(() => null);
        if (prelimJson && prelimJson.orderId) {
          orderIdFromAirtable = prelimJson.orderId;
        }
        if (prelimJson && prelimJson.dropbox && prelimJson.dropbox.shared_link) {
          dropboxSharedLink = prelimJson.dropbox.shared_link;
        }
        if (orderIdFromAirtable) {
          try { mergePayload({ airtable_order_id: orderIdFromAirtable }); } catch {}
        }
        if (dropboxSharedLink) {
          try { mergePayload({ financial: { ...(payload?.financial || {}), dropbox_shared_link: dropboxSharedLink } }); } catch {}
        }
      } catch {}

      // Recreate the same uploads we generated in Cart for naming consistency
      const uploads = (async () => {
        try {
          const list = [];
          // helper to push an upload record
          const pushUpload = (u) => { if (u) list.push(u); };

          for (const item of (cartItems || [])) {
            const product = item.productSku || item.product || 'product';
            const matrices = item.sizeMatrices || {};
            const colors = item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length
              ? item.selectedColors
              : (item.color ? [item.color] : []);
            const activeColors = [];
            let totalQtyForItem = 0;
            for (const c of colors) {
              const mat = (matrices && matrices[c]) || (c === item.color ? (item.sizeMatrix || {}) : {});
              const qty = Object.values(mat || {}).reduce((s, q) => s + (q || 0), 0);
              if (qty > 0) { activeColors.push(c); totalQtyForItem += qty; }
            }
            if (activeColors.length === 0) continue;
            const areaMethod = {};
            (item.selectedPrintAreas || []).forEach((sel) => {
              if (!sel) return;
              if (typeof sel === 'string') areaMethod[sel] = 'print';
              else if (sel.areaKey) areaMethod[sel.areaKey] = sel.method || 'print';
            });
            const designs = item.uploadedDesigns || {};
            for (const areaKey of Object.keys(designs)) {
              const d = designs[areaKey];
              if (!d || !d.url) continue;
              const method = areaMethod[areaKey] || 'print';
              const fileName = d.name || `${areaKey}.png`;
              // original design upload: prefer originalUrl (for PDFs) if present
              const originalOrPreview = (d.originalUrl && typeof d.originalUrl === 'string') ? d.originalUrl : d.url;
              pushUpload({ areaKey, method, product, colors: activeColors, qty: totalQtyForItem, dataUrl: originalOrPreview, fileName });
              // mockup composite
              try {
                const side = areaKey.startsWith('back') ? 'back' : 'front';
                const baseImage = `/schematics/${side}.png`;
                const mockupDataUrl = await composeMockupImage({ areaKey, baseImage, designUrl: d.url });
                if (mockupDataUrl) {
                  pushUpload({ areaKey, method: 'mockup', product, colors: activeColors, qty: totalQtyForItem, dataUrl: mockupDataUrl, fileName: `${areaKey}-mockup.png` });
                }
              } catch (_) {}
            }
            // Create a worksheet PDF per product with auto-pagination
            try {
              const pagePngs = [];
              let startColorIndex = 0;
              let startAreaIndex = 0;
              let guard = 0;
              while (guard++ < 10) { // hard safety upper-bound to avoid infinite loops
                const result = await composeWorksheetImage({
                  item,
                  language: 'en',
                  dropboxLink: dropboxSharedLink || (payload?.financial?.dropbox_shared_link || ''),
                  idempotencyKey: idempotencyKeyRef.current,
                  orderNumber: (orderIdFromAirtable || payload?.airtable_order_id || ''),
                  customer: { name, phone, email, address_street: payload?.contact?.street || payload?.contact?.address_street || '', address_city: payload?.contact?.city || payload?.contact?.address_city || '' },
                  financial: { subtotal: subtotal0, delivery: delivery0, vat: vat0, total: total0, payment_method: method },
                  delivery: { method: payload?.withDelivery ? 'Delivery' : 'Pickup', notes: payload?.deliveryNotes || '' },
                  returnMeta: true,
                  startColorIndex,
                  startAreaIndex,
                });
                if (!result || !result.dataUrl) break;
                pagePngs.push(result.dataUrl);
                const consumedColors = (result.consumed && result.consumed.colors) || 0;
                const consumedAreas = (result.consumed && result.consumed.areas) || 0;
                if (consumedColors === 0 && consumedAreas === 0) break; // nothing consumed; stop
                startColorIndex += consumedColors;
                startAreaIndex += consumedAreas;
                // If everything consumed (all colors and areas rendered), stop
                const totalColors = Object.keys(item.sizeMatrices || {}).length;
                const totalAreas = (item.selectedPrintAreas || []).length;
                if (startColorIndex >= totalColors && startAreaIndex >= totalAreas) break;
              }
              if (pagePngs.length > 0) {
                const pdfDataUrl = await pngsToPdf(pagePngs, { widthPx: 1240, heightPx: 1754 });
                if (pdfDataUrl) {
                  pushUpload({ areaKey: 'worksheet', method: 'worksheet', product, colors: activeColors, qty: totalQtyForItem, dataUrl: pdfDataUrl, fileName: 'worksheet.pdf' });
                }
              }
            } catch (_) {}
          }
          return list;
        } catch (e) { return []; }
      })();

      const subtotal = subtotalAfterDiscount;
      const delivery = deliveryCost;
      const vat = vatAmount;
      const total = baseTotal;
      const financialBlock = { subtotal, delivery, vat, total, payment_method: method };
      const builtUploads = await uploads;
      const enriched = {
        idempotency_key: idempotencyKeyRef.current,
        gclid: payload?.tracking?.googleAds?.gclid || '',
        campaign: payload?.tracking?.googleAds?.campaign || '',
        search: payload?.tracking?.googleAds?.keyword || '',
        device: payload?.tracking?.metadata?.device || '',
        customer: {
          name,
          phone,
          email,
          // Map our DeliveryOptions contact shape (street/city) into canonical fields
          address_street: payload?.contact?.street || payload?.contact?.address_street || '',
          address_city: payload?.contact?.city || payload?.contact?.address_city || '',
        },
        financial: financialBlock,
        cart: {
          items: (cartItems || []).map((i) => {
            // Normalize selected print areas
            const areas = (i.selectedPrintAreas || []).map((sel) => {
              if (!sel) return null;
              if (typeof sel === 'string') return { areaKey: sel, method: 'print', printColor: 'as-is', designerComments: '' };
              return {
                areaKey: sel.areaKey,
                method: sel.method || 'print',
                printColor: sel.printColor || 'as-is',
                designerComments: sel.designerComments || '',
              };
            }).filter(Boolean);

            // Ensure sizeMatrices exists; fallback from legacy single color/sizeMatrix if needed
            const matrices = (i.sizeMatrices && typeof i.sizeMatrices === 'object')
              ? i.sizeMatrices
              : (i.color ? { [i.color]: (i.sizeMatrix || {}) } : {});

            return {
              productSku: i.productSku,
              productName: i.productName,
              sizeMatrices: matrices,
              selectedPrintAreas: areas,
            };
          }),
        },
        // Actual files to upload server-side
        uploads: builtUploads,
        // Lightweight metadata for Airtable payload (avoid duplicating dataUrl)
        cartUploads: (builtUploads || []).map((u) => ({
          areaKey: u.areaKey,
          method: u.method,
          product: u.product,
          colors: u.colors,
          qty: u.qty,
          fileName: u.fileName,
        })),
      };

      try {
        const resp = await fetch('/api/airtable/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enriched),
        });
        try {
          const j = await resp.json().catch(() => null);
          const link = j && j.dropbox && j.dropbox.shared_link;
          if (link) {
            try { mergePayload({ financial: { ...(payload?.financial || {}), dropbox_shared_link: link } }); } catch (e) {}
          }
        } catch (_) {}
      } catch (_) {}
    } catch (_) {}


    // helper: compute total charge (incl. VAT and delivery)
    const computeTotalCharge = () => ({
      subtotal: subtotalAfterDiscount,
      delivery: deliveryCost,
      totalToCharge: baseTotal,
    });

    const persistGtagPayload = (overrideValue) => {
      try {
        const { totalToCharge } = computeTotalCharge();
        const stored = {
          transaction_id: (payload?.airtable_order_id || idempotencyKeyRef.current || ''),
          value: Number(overrideValue != null ? overrideValue : totalToCharge) || 0,
          currency: 'ILS',
        };
        try { localStorage.setItem('order_payload_for_gtag', JSON.stringify(stored)); } catch (e) {}
      } catch (e) {}
    };

    if (method === 'card') {
      // Build iCount payment URL and redirect
      try {
        const pageCode = (import.meta?.env?.VITE_ICOUNT_PAGE_CODE || '6fa96').trim();
  const base = (import.meta?.env?.VITE_ICOUNT_BASE_URL || 'https://app.icount.co.il/m').replace(/\/$/, '');
    // iCount docs: use 'sum' for amount, standard customer fields like 'full_name', 'contact_email', 'contact_phone'
    // and any custom fields prefixed with 'm__' are returned in IPN with the prefix removed.
    const amountParam = (import.meta?.env?.VITE_ICOUNT_AMOUNT_PARAM || 'sum');
    // We'll send our idempotency key as a custom field so iCount returns it back in IPN: m__idem
    const idemParam = (import.meta?.env?.VITE_ICOUNT_IDEM_PARAM || 'm__idem');
  const successParam = (import.meta?.env?.VITE_ICOUNT_SUCCESS_URL_PARAM || 'success_url');
  const failureParam = (import.meta?.env?.VITE_ICOUNT_FAILURE_URL_PARAM || 'failure_url');
  const cancelParam = (import.meta?.env?.VITE_ICOUNT_CANCEL_URL_PARAM || 'cancel_url');
  const nameParam = (import.meta?.env?.VITE_ICOUNT_NAME_PARAM || 'full_name');
  const emailParam = (import.meta?.env?.VITE_ICOUNT_EMAIL_PARAM || 'contact_email');
  const phoneParam = (import.meta?.env?.VITE_ICOUNT_PHONE_PARAM || 'contact_phone');

  const amountToCharge = paymentTotal;

        const u = new URL(`${base}/${pageCode}`);
  u.searchParams.set(amountParam, String(amountToCharge));
  // For compatibility: some iCount pages accept 'cs' (custom sum) or 'sum'. Send both.
  try { u.searchParams.set('cs', String(amountToCharge)); } catch {}
  // Include a short description and currency code to help some page configurations
  // Build a prettier description: use first product name (fallback to sku) and total qty, include 'מיתוג'
  try {
    const firstItem = (cartItems && cartItems[0]) || null;
    const itemName = firstItem ? (firstItem.productName || firstItem.productSku || 'Product') : 'Product';
    // Use getTotalItems() (CartContext) to compute total quantity so it's accurate and consistent
    const totalQty = typeof getTotalItems === 'function' ? Number(getTotalItems() || 0) : (Array.isArray(cartItems) ? cartItems.length : 0);
    const pretty = `${itemName} ${totalQty} כולל מיתוג`;
    u.searchParams.set('cd', pretty);
  } catch {}
  // Do not force currency here — let the iCount page configuration determine displayed currency (it may be EUR)
  // Avoid iCount overriding incoming UTM params when the page is configured to respect them
  try { u.searchParams.set('utm_nooverride', '1'); } catch {}
  // Attach idempotency as a custom 'm__' prefixed field so iCount echoes it back in IPN / redirect
  u.searchParams.set(idemParam, idempotencyKeyRef.current);
  if (name && name.trim()) u.searchParams.set(nameParam, name.trim());
  if (email && email.trim()) u.searchParams.set(emailParam, email.trim());
  if (phone && phone.trim()) u.searchParams.set(phoneParam, phone.trim());
        try {
          const idem = encodeURIComponent(idempotencyKeyRef.current);
          // iCount will append their own params (docnum, doc_url, etc.) to whatever success URL we provide.
          // We only need to include our idem for matching the order on return.
          u.searchParams.set(successParam, `${window.location.origin}/thank-you-cc?idem=${idem}`);
          u.searchParams.set(failureParam, `${window.location.origin}/cart?status=failed`);
          u.searchParams.set(cancelParam, `${window.location.origin}/cart`);
        } catch {}

        setProcessing(false);
        onClose();
        // Persist minimal order info so returning from external payment can still fire gtag
  try { persistGtagPayload(amountToCharge); } catch (e) {}
        window.location.assign(u.toString());
        return;
      } catch (e) {
        // As a fallback, keep the original UX
        toast({ title: 'תודה', description: 'הזמנה התקבלה. ניצור קשר להמשך.', variant: 'default' });
        // Persist for standard thank-you so purchase has value/tx
        try { persistGtagPayload(); } catch (err) {}
        try { navigate('/thank-you'); } catch (err) {}
        setProcessing(false);
        onClose();
        return;
      }
    }

    if (method === 'bit') {
      toast({ title: 'העבר כספים ל-Bit' });
      // show phone for payment in a toast plus more persistent suggestion
      toast({ title: 'Bit / Paybox', description: 'העבירו ל: 054-696-9974. שלחו צילום אישור תשלום ל-info@printmarket.co.il' });
      // Backend removed: no background forward
      // navigate to thank-you page so the user sees confirmation/next steps
      // Persist for standard thank-you so purchase has value/tx
      try { persistGtagPayload(); } catch (e) {}
      try { navigate('/thank-you'); } catch (e) { /* ignore */ }
      setProcessing(false);
      onClose();
      return;
    }

  // wire transfer or cheque
  toast({ title: 'תודה', description: 'נציגנו יצור איתך קשר בהקדם כדי להשלים את פרטי התשלום.' });
  // Fire-and-forget background forward as well
    // Backend removed: no background forward
  // Persist for standard thank-you so purchase has value/tx
  try { persistGtagPayload(); } catch (e) {}
  try { navigate('/thank-you'); } catch (e) { /* ignore */ }
  setProcessing(false);
  onClose();
  };

  const methodCards = [
    { id: 'card', label: 'כרטיס אשראי (הנחה נוספת 3%)', icon: CreditCard },
    { id: 'bit', label: 'Bit / Paybox', icon: Smartphone },
    { id: 'wire', label: 'העברה בנקאית', icon: Banknote },
    { id: 'cheque', label: 'שיק', icon: FileText },
  ];

  // Refs for method buttons to support keyboard navigation
  const methodRefs = useRef([]);

  if (!open) return null;

  const onMethodKeyDown = (e) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const idx = methodCards.findIndex((m) => m.id === method);
    if (idx === -1) return;
    let next = idx;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + methodCards.length) % methodCards.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % methodCards.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = methodCards.length - 1;
    const nextId = methodCards[next].id;
    setMethod(nextId);
    // focus the new option
    const node = methodRefs.current[next];
    if (node && node.focus) node.focus();
  };

  return (
    <div className="fixed inset-0 z-60">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute right-6 top-28 w-[480px] max-w-[95%] bg-white rounded-2xl p-6 shadow-2xl ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="checkout-modal-title" className="text-lg font-bold">אמצעי תשלום</h2>
          <button
            aria-label="סגור" 
            onClick={onClose}
            className="ml-3 text-gray-500 hover:text-gray-700"
            style={{ background: 'transparent', border: 0 }}
          >
            ✕
          </button>
          <div className="text-sm text-gray-500">סה"כ: {totalWithVat}</div>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span>{t('total')}</span>
            <span>{formatCurrency(baseTotal)}</span>
          </div>
          {cardDiscount > 0 && (
            <div className="flex items-center justify-between text-green-600 font-medium">
              <span>{t('cardPaymentDiscount')}</span>
              <span>-{formatCurrency(cardDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-semibold">
            <span>{cardDiscount > 0 ? t('totalDue') : t('total')}</span>
            <span>{totalWithVat}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div role="radiogroup" aria-label="Payment methods" onKeyDown={onMethodKeyDown} className="col-span-2 grid grid-cols-2 gap-3">
            {methodCards.map(({ id, label, icon: Icon }, i) => (
              <motion.button
                key={id}
                ref={(el) => { methodRefs.current[i] = el; }}
                role="radio"
                aria-checked={method === id}
                tabIndex={method === id ? 0 : -1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMethod(id)}
                className={`flex items-center gap-3 p-3 rounded-lg border ${method === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} text-sm`}
              >
                <div className={`p-2 rounded-md ${method === id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  <Icon size={18} />
                </div>
                <div className="text-right flex-1">
                  {id === 'card' ? (
                    <>
                      <div className="font-medium">כרטיס אשראי</div>
                      <div className="text-xs text-green-600 font-medium">(הנחה נוספת 3%)</div>
                    </>
                  ) : (
                    <div className="font-medium">{label}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
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

        {method === 'card' && cardDiscount > 0 && (
          <div className="text-sm text-green-600 font-medium text-center mt-3">
            חסכת {formatCurrency(cardDiscount)} בבחירת תשלום בכרטיס אשראי
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-4">
          <Button onClick={handleConfirm} className="flex-1" disabled={processing || !(name.trim() && phone.trim() && email.trim())}>{method === 'card' ? 'המשך לתשלום מאובטח בכרטיס אשראי' : method === 'bit' ? 'השלם תשלום ב-Bit' : 'שלח פרטי יצירת קשר'}</Button>
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
