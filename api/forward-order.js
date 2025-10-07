import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import normalize from '../src/lib/normalizeOrderPayload.js';
import { uploadBuffer, createSharedLink, createFolder } from '../src/lib/dropboxClient.js';
import { ensureOrderRecord, airtableEnabled, updateOrderRecord } from '../src/lib/airtableClient.js';

// Dropbox uploads base folder (clean, relative to namespace root). Overridable via env.
const DROPBOX_BASE_FOLDER = process.env.DROPBOX_BASE_FOLDER || '/printee/uploads';
// Namespace targeting: when set, prefix paths with ns:<id> so writes occur under that namespace root
const DROPBOX_NAMESPACE_ID = process.env.DROPBOX_NAMESPACE_ID || process.env.DROPBOX_ROOT_NAMESPACE_ID || null;

// TEMP: Capture endpoint for debugging payloads. Override with env PABBLY_URL in prod.
const DEFAULT_PABBY_URL = "https://webhook.site/b8a571ab-96ef-4bfc-82fa-226594dc2a4a";
// Verbose logging toggle
const DEBUG_FORWARDER = String(process.env.DEBUG_FORWARDER || '0') === '1';

const schemaPath = path.resolve(process.cwd(), 'schemas', 'order.schema.json');
let orderSchema = null;
try {
  orderSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Could not load schema for payload validation', err?.message || err);
}

// Load a lighter Pabbly schema for final payload checks (optional, non-blocking)
let pabblySchema = null;
try {
  const pPath = path.resolve(process.cwd(), 'schemas', 'pabbly-order.schema.json');
  pabblySchema = JSON.parse(fs.readFileSync(pPath, 'utf8'));
} catch (e) {
  if (DEBUG_FORWARDER) console.warn('Could not load pabbly-order.schema.json', e && e.message);
}

const ajv = new Ajv({ allErrors: true, strict: false });
// Enable standard string formats like date-time, email, uri, etc.
addFormats(ajv);
const validate = orderSchema ? ajv.compile(orderSchema) : null;
const validatePabbly = pabblySchema ? ajv.compile(pabblySchema) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (process.env.DEBUG_FORWARDER === '1') {
    try { console.log('forward-order incoming request', { url: req.url, method: req.method, headersSnippet: JSON.stringify({ 'content-length': req.headers['content-length'] || null }).slice(0,200) }); } catch (e) {}
  }

  const pabblyUrl = process.env.PABBLY_URL || DEFAULT_PABBY_URL;

  try {
    const appBody = req.body;
    const isPartial = Boolean((appBody && (appBody.partial || appBody._partial)) || req.headers['x-forward-partial'] || req.headers['x-partial-forward']);
    // log incoming raw body for tracing (serverless logs)
  if (DEBUG_FORWARDER) console.log('forward-order incoming raw body:', JSON.stringify(appBody).slice(0, 1000));
    // Step 1: Ensure we have a canonical normalized snapshot early to extract common fields
    const preNormalized = typeof normalize === 'function' ? normalize(appBody || {}) : (appBody || {});

    // Step 2: Ensure an Airtable order exists (before Dropbox) to get a stable order_id we can reuse everywhere
  let ensured = { order_id: null, order_number: null, enabled: false };
  const forwarderWarnings = [];
    try {
      if (airtableEnabled()) {
        ensured = await ensureOrderRecord({
          idempotency_key: preNormalized.idempotency_key,
          order_number: preNormalized?.order?.order_number,
          created_at: preNormalized.created_at
        });

        // As soon as we have (or created) the Airtable record, persist contact fields if present
        try {
          const recId = ensured?.airtable_record_id || ensured?.order_id;
          const fields = {};
          const cn = preNormalized?.customer?.contact_name || preNormalized?.contact?.name;
          const ce = preNormalized?.customer?.email || preNormalized?.contact?.email;
          const cp = preNormalized?.customer?.phone || preNormalized?.contact?.phone;
          if (cn) fields.ContactName = cn;
          if (ce) fields.ContactEmail = ce;
          if (cp) fields.ContactPhone = cp;
          if (recId && Object.keys(fields).length) {
            await updateOrderRecord(recId, fields).catch(()=>{});
          }
        } catch (e) { /* ignore contact persist failure */ }
      }
    } catch (e) {
      console.warn('forward-order: airtable ensure failed', e?.message || e);
      forwarderWarnings.push({ when: new Date().toISOString(), where: 'airtable.ensure', message: e?.message || String(e) });
    }
    if (!airtableEnabled()) {
      forwarderWarnings.push({ when: new Date().toISOString(), where: 'airtable', message: 'Airtable not enabled or missing env' });
    }

    // If the payload contains uploadedDesigns with data URLs, upload them to Dropbox now, using order_id for folder naming
    async function uploadDataUrlToDropbox(dataUrl, filenameHint) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!m) throw new Error('invalid_data_url');
      const mime = m[1];
      const ext = (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0,8);
      const base64 = m[2];
      const buf = Buffer.from(base64, 'base64');

    const baseFolder = DROPBOX_BASE_FOLDER || '/printee/uploads';
    // Per requirement: use the Airtable Order# as the subfolder name
    const folderKey = ensured?.order_number || preNormalized?.order?.order_number || ensured?.order_id || preNormalized?.order?.order_id || null;
    const orderFolder = folderKey ? `${baseFolder}/${folderKey}` : baseFolder;
      const name = `${Date.now()}-${uuidv4()}-${(filenameHint||'file').replace(/[^a-z0-9.\-_]/gi,'')}`;
      const filename = name + (ext ? `.${ext}` : '');
    const nsPrefix = DROPBOX_NAMESPACE_ID ? `ns:${DROPBOX_NAMESPACE_ID}` : '';
    const dropboxPath = `${nsPrefix}${orderFolder}/${filename}`;

      await uploadBuffer(buf, dropboxPath);
      const link = await createSharedLink(dropboxPath).catch(()=>null);
      return { url: link || null, path: dropboxPath, name: filename, size: buf.length };
    }

    // scan uploadedDesigns at top-level and inside cart items for data URLs and upload them
    const bodyCandidate = JSON.parse(JSON.stringify(appBody || {}));
  const uploads = [];
    function collectAndUpload(obj, parentKey) {
      if (!obj || typeof obj !== 'object') return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v && typeof v === 'string' && v.startsWith('data:')) {
          uploads.push({ container: obj, key: k, dataUrl: v });
        } else if (Array.isArray(v)) {
          v.forEach((it, idx) => collectAndUpload(it, `${parentKey || ''}${k}[${idx}]`));
        } else if (v && typeof v === 'object') {
          collectAndUpload(v, `${parentKey || ''}${k}.`);
        }
      }
    }
    collectAndUpload(bodyCandidate);
    if (uploads.length) {
      for (const up of uploads) {
        try {
          const filenameHint = (up.container && up.container.name) || (up.container && up.container.file && up.container.file.name) || 'design';
          const result = await uploadDataUrlToDropbox(up.dataUrl, filenameHint);
          up.container[up.key] = { url: result.url, dropbox_path: result.path, name: result.name, size: result.size };
          // Debug log: show where we uploaded (safe, no tokens)
          if (DEBUG_FORWARDER) console.log('forward-order: uploaded to dropbox path:', result.path);
        } catch (e) {
          const msg = e && (e.message || String(e)) || 'unknown';
          console.error('forward-order: dropbox upload failed', msg);
          // record a warning for the normalized payload so downstream systems can see it
          forwarderWarnings.push({ when: new Date().toISOString(), where: up.key, message: msg });
          // attach a note but continue — do not block forwarding for other reasons
          up.container[up.key] = { error: String(msg) };
        }
      }
    }
    else {
      // No uploads: ensure order folder exists so downstream users can see the order folder even
      // when there are no attached files. This is non-fatal; record warnings on failure.
      try {
        const folderKey = ensured?.order_number || preNormalized?.order?.order_number || ensured?.order_id || preNormalized?.order?.order_id || null;
        const orderFolder = folderKey ? `${DROPBOX_BASE_FOLDER}/${folderKey}` : DROPBOX_BASE_FOLDER;
        const nsPrefix = DROPBOX_NAMESPACE_ID ? `ns:${DROPBOX_NAMESPACE_ID}` : '';
        const folderPath = `${nsPrefix}${orderFolder}`;
  if (DEBUG_FORWARDER) console.log('forward-order: creating dropbox folder', folderPath);
        const createResult = await createFolder(folderPath).catch((e) => { throw e; });
        if (DEBUG_FORWARDER) console.log('forward-order: createFolder result snippet:', JSON.stringify(createResult).slice(0,400));
        // Attempt to make a shared link for the folder so downstream systems (Pabbly) can access it
        try {
          const folderShared = await createSharedLink(folderPath).catch(()=>null);
          if (folderShared) {
            bodyCandidate._dropbox_folder_url = folderShared;
            if (DEBUG_FORWARDER) console.log('forward-order: created shared link for folder', folderShared);
          }
        } catch (e) {
          if (DEBUG_FORWARDER) console.warn('forward-order: createSharedLink failed', e && e.message);
        }
      } catch (e) {
        const msg = e && (e.message || String(e)) || 'unknown';
        forwarderWarnings.push({ when: new Date().toISOString(), where: 'dropbox.create_folder', message: msg });
        if (DEBUG_FORWARDER) console.warn('forward-order: dropbox create folder failed', msg);
      }
    }

  // Attach warnings into the candidate so normalize can carry them into the final payload
  if (forwarderWarnings.length) bodyCandidate._forwarder_warnings = forwarderWarnings;

  // Re-normalize after uploads and include the ensured order_id if present
    const bodyTmp = typeof normalize === 'function' ? normalize(bodyCandidate) : bodyCandidate;
    let body = bodyTmp;
    if (body?.order) {
      body = { ...body, order: { ...body.order } };
      if (ensured?.enabled && ensured?.order_id) body.order.order_id = ensured.order_id;
      if (ensured?.enabled && ensured?.order_number) body.order.order_number = String(ensured.order_number);
    }
    // also surface Airtable-specific ids only if Airtable is enabled and present
    if (ensured?.enabled && (ensured?.airtable_record_id || ensured?.order_number)) {
      body._airtable = { record_id: ensured.airtable_record_id || ensured.order_id, order_number: ensured.order_number || null };
    }
    // attach forwarder warnings into final body so downstream systems (Pabbly) can see upload/airtable issues
    if (forwarderWarnings.length) {
      body._forwarder_warnings = (body._forwarder_warnings || []).concat(forwarderWarnings);
    }
    // Ensure a top-level cart array exists for downstream systems that expect it (e.g., Pabbly UI)
    try {
      const rawCart = (bodyCandidate && bodyCandidate.cart) != null ? bodyCandidate.cart : null;
      let cartParsed = rawCart;
      if (typeof rawCart === 'string') {
        try { cartParsed = JSON.parse(rawCart); } catch { cartParsed = rawCart; }
      }
      if (Array.isArray(cartParsed)) {
        body.cart = cartParsed;
      }
    } catch (e) { /* ignore cart attach error */ }
    // log normalized body snippet
  if (DEBUG_FORWARDER) console.log('forward-order normalized body snippet:', JSON.stringify(body).slice(0, 1000));

    // --- Canonicalize fields for Pabbly / downstream systems ---
    try {
      // Version for downstream tracking
      body.version = body.version || '2025-10-07';
      // Airtable record id (prefer explicit _airtable entry)
      body.airtable_record_id = body._airtable?.record_id || body._airtable?.id || (ensured && (ensured.airtable_record_id || ensured.order_id)) || null;

      // Top-level order_number convenience
      body.order_number = body.order?.order_number || (body._airtable && body._airtable.order_number) || null;

      // Ensure customer block exists and prefer contact fields
      body.customer = body.customer || {};
      const contact = body.contact || body._app_payload?.contact || {};
      body.customer.contact_name = body.customer.contact_name || contact.name || contact.fullName || body.customer.contact_name || '';
      body.customer.email = body.customer.email || contact.email || '';
      body.customer.phone = body.customer.phone || contact.phone || '';
      // Promote address into customer.address as a normalized object
      body.customer.address = body.customer.address || {
        line1: body.delivery?.address_line1 || '',
        line2: body.delivery?.address_line2 || '',
        city: body.delivery?.city || '',
        postcode: body.delivery?.postcode || '',
        country: body.delivery?.country || ''
      };

  // Ensure cart exists as array
  if (!Array.isArray(body.cart)) body.cart = [];

      // Coerce numeric fields in cart items where possible
      body.cart = body.cart.map((it, idx) => {
        const item = (typeof it === 'string') ? (() => { try { return JSON.parse(it); } catch { return { name: String(it) }; } })() : (it || {});
        // ensure keys
        item.line_id = item.line_id || item.id || `line-${idx}`;
  item.product_name = item.product_name || item.productName || (item.product && (item.product.name || item.product.productName)) || item.name || '';
  item.sku = item.sku || item.product_sku || item.productSku || (item.product && item.product.sku) || '';
        // Derive quantity from size matrices when not explicitly provided
        try {
          if (!(Number(item.quantity) > 0)) {
            const matrices = item.sizeMatrices || item.sizeMatrix || {};
            if (matrices && typeof matrices === 'object') {
              let q = 0;
              const colors = Object.keys(matrices);
              for (const c of colors) {
                const mat = matrices[c] || {};
                for (const s of Object.keys(mat || {})) q += Number(mat[s] || 0) || 0;
              }
              item.quantity = Number(q) || 0;
            }
          }
        } catch {}
        item.quantity = Number(item.quantity || item.qty || 0) || 0;
        item.unit_price = Number(item.unit_price || item.price || item.unitPrice || 0) || 0;
        // Prefer explicit line_total, then totalPrice from client, then unit*qty
        item.line_total = Number(item.line_total || item.totalPrice || (item.unit_price * item.quantity) || 0) || 0;
        // Normalize print_areas if present
        if (item.print_areas && Array.isArray(item.print_areas)) {
          item.print_areas = item.print_areas.map(pa => ({
            area_name: pa.areaKey || pa.key || pa.area_name || pa.name || '',
            file_url: (pa.url || pa.file_url || (pa.file && pa.file.url)) || '',
            method: pa.method || pa.print_method || 'print',
            print_color: pa.print_color || pa.printColor || '',
            designer_comments: pa.designer_comments || pa.designerComments || pa.comments || ''
          }));
        }
        // If print_areas missing but selectedPrintAreas exist (client-side shape), map them
        if ((!Array.isArray(item.print_areas) || item.print_areas.length === 0) && Array.isArray(item.selectedPrintAreas)) {
          try {
            item.print_areas = item.selectedPrintAreas.map((spa) => {
              const pa = (typeof spa === 'string') ? { areaKey: spa, method: 'print' } : (spa || {});
              return {
                area_name: pa.areaKey || pa.key || pa.area_name || pa.name || '',
                file_url: '',
                method: pa.method || 'print',
                print_color: pa.print_color || pa.printColor || '',
                designer_comments: pa.designer_comments || pa.designerComments || pa.comments || ''
              };
            });
          } catch {}
        }
        // If uploadedDesigns exist, map their URLs into corresponding print_areas by area key
        try {
          const designs = item.uploadedDesigns || item.uploaded_designs || null;
          if (designs && typeof designs === 'object' && Array.isArray(item.print_areas)) {
            for (const pa of item.print_areas) {
              const key = (pa.area_name || '').toString();
              const design = designs[key] || designs[pa.area_name] || null;
              if (design && !pa.file_url) {
                const url = design.url || design.link || (design.file && design.file.url) || '';
                if (url) pa.file_url = url;
              }
            }
          }
        } catch {}
        // Normalize colors/sizeMatrices if present
        if (item.sizeMatrices || item.sizeMatrix || item.size_matrix) {
          const matrices = item.sizeMatrices || item.sizeMatrix || item.size_matrix || {};
          const colors = [];
          for (const c of Object.keys(matrices)) {
            const mat = matrices[c] || {};
            const size_matrix = {};
            for (const s of Object.keys(mat || {})) size_matrix[s] = Number(mat[s] || 0) || 0;
            colors.push({ color: c, size_matrix });
          }
          if (colors.length) item.colors = colors;
        }
        return item;
      });

      // Fallback: if cart is still empty but normalized items exist, synthesize a minimal cart from items
      try {
        if ((!Array.isArray(body.cart) || body.cart.length === 0) && Array.isArray(bodyTmp?.items) && bodyTmp.items.length) {
          body.cart = bodyTmp.items.map((ni, idx) => {
            const qty = Array.isArray(ni.size_breakdown) ? ni.size_breakdown.reduce((s, r) => s + (Number(r.qty)||0), 0) : 0;
            return {
              line_id: ni.line_id || `line-${idx}`,
              product_name: ni.product_name || '',
              sku: ni.product_sku || '',
              quantity: qty,
              unit_price: 0,
              line_total: 0,
              print_areas: Array.isArray(ni.print_areas) ? ni.print_areas.map(pa => ({
                area_name: pa.areaKey || pa.key || pa.area_name || pa.name || '',
                file_url: '',
                method: pa.method || 'print',
                print_color: pa.print_color || pa.printColor || '',
                designer_comments: pa.designer_comments || pa.designerComments || ''
              })) : []
            };
          });
        }
      } catch (e) {
        if (DEBUG_FORWARDER) console.warn('forward-order: build cart from items failed', e && e.message);
      }

      // If normalized items exist (from normalize()), merge print_areas into cart items when missing
      try {
        const normItems = Array.isArray(bodyTmp?.items) ? bodyTmp.items : [];
        if (normItems.length && body.cart.length) {
          const byLineOrSku = new Map();
          body.cart.forEach((ci, i) => {
            const key = String(ci.line_id || ci.sku || i);
            byLineOrSku.set(key, ci);
          });
          normItems.forEach((ni, j) => {
            const key = String(ni.line_id || ni.product_sku || j);
            const target = byLineOrSku.get(key);
            if (target) {
              if (!Array.isArray(target.print_areas) || target.print_areas.length === 0) {
                if (Array.isArray(ni.print_areas) && ni.print_areas.length) {
                  target.print_areas = ni.print_areas.map(pa => ({
                    area_name: pa.areaKey || pa.key || pa.area_name || pa.name || '',
                    file_url: '',
                    method: pa.method || 'print',
                    print_color: pa.print_color || pa.printColor || '',
                    designer_comments: pa.designer_comments || pa.designerComments || ''
                  }));
                }
              }
            }
          });
        }
      } catch (e) {
        if (DEBUG_FORWARDER) console.warn('forward-order: merge print_areas warning', e && e.message);
      }

      // Finance block: coerce and compute totals
      const appTotal = Number(body._app_payload?.cartSummary?.total || 0) || 0;
      const subtotal = Number(body.order?.totals?.subtotal) || appTotal || body.cart.reduce((s,i)=> s + (Number(i.line_total)||0), 0);
      const deliveryCost = Number(body.order?.totals?.delivery) || Number(body.delivery?.delivery_cost) || 0;
      const vatPercent = Number(body.order?.totals?.vat_percent) || 17;
      const vatAmount = Number(body.order?.totals?.vat_amount) || Math.round((subtotal + deliveryCost) * (vatPercent/100));
      const grandTotal = Number(body.order?.totals?.grand_total) || (subtotal + deliveryCost + vatAmount);

      body.order = body.order || {};
      body.order.totals = body.order.totals || {};
      body.order.totals.subtotal = Number(subtotal);
      body.order.totals.delivery = Number(deliveryCost);
      body.order.totals.vat_percent = Number(vatPercent);
      body.order.totals.vat_amount = Number(vatAmount);
      body.order.totals.grand_total = Number(grandTotal);

      // Build a fallback description from first items if missing
      if (!body.order.description) {
        const srcCart = (body.cart && body.cart.length) ? body.cart : (Array.isArray(bodyTmp?.items) ? bodyTmp.items : []);
        const names = (srcCart || []).slice(0, 3).map(i => {
          const n = i.product_name || i.name || i.product_name || 'פריט';
          const q = Number(i.quantity || (Array.isArray(i.size_breakdown) ? i.size_breakdown.reduce((s,r)=>s+(Number(r.qty)||0),0) : 0) || 0);
          return q ? `${n} x${q}` : n;
        });
        body.order.description = names.length ? `הזמנה: ${names.join(', ')}${(srcCart || []).length > 3 ? '…' : ''}` : '';
      }

      // Top-level finance object
      body.finance = body.finance || {};
      body.finance.paid = Boolean(body.finance.paid || (body._app_payload && body._app_payload.paid) || false);
      body.finance.payment_method = body.finance.payment_method || body._app_payload?.paymentMethod || body.paymentMethod || '';
      body.finance.subtotal = body.finance.subtotal || Number(body.order.totals.subtotal) || 0;
      body.finance.delivery_cost = body.finance.delivery_cost || Number(body.order.totals.delivery) || 0;
      body.finance.vat_percent = Number(body.order.totals.vat_percent) || vatPercent;
      body.finance.vat_amount = Number(body.order.totals.vat_amount) || vatAmount;
      body.finance.grand_total = Number(body.order.totals.grand_total) || grandTotal;

      // Dropbox folder url promoted to top-level if present
      body.dropbox_folder_url = body._app_payload?._dropbox_folder_url || body._dropbox_folder_url || null;

      // Delivery boolean flag
      body.delivery = body.delivery || {};
      body.delivery.required = Boolean(body.delivery.withDelivery || body.delivery.with_delivery || body.delivery.withDelivery === true || body.delivery.withDelivery === '1');

      // Payment object
      body.payment = body.payment || {};
      body.payment.method = body.payment.method || body.finance.payment_method || '';
      body.payment.amount = body.payment.amount || Number(body.finance.grand_total) || 0;
      body.payment.currency = body.payment.currency || body.order?.currency || 'ILS';
      body.payment.status = body.payment.status || (body.payment.amount ? 'pending' : 'unpaid');

      // Audit fields
      body._forwarded_at = new Date().toISOString();
      // We'll set is_partial after computing derivedPartial below
    } catch (e) {
      if (DEBUG_FORWARDER) console.warn('forward-order: canonicalization error', e && (e.message || e));
    }

    if (DEBUG_FORWARDER) {
      try { console.log('forward-order final canonical snippet:', JSON.stringify({
        airtable_record_id: body.airtable_record_id,
        order_number: body.order_number,
        finance: body.finance,
        cartLen: Array.isArray(body.cart) ? body.cart.length : 0,
        dropbox_folder_url: body.dropbox_folder_url
      }).slice(0, 1200)); } catch {}
    }

    if (validate) {
      const valid = validate(body);
      if (!valid) {
        console.warn('forward-order validation failed', validate.errors);
        return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors, normalized: body });
      }
    }

    // In partial mode, skip forwarding to Pabbly — just acknowledge after uploads/Airtable
    if (isPartial) {
      return res.status(200).json({ ok: true, partial: true, normalized: body, warnings: forwarderWarnings });
    }

    // Determine partial status: explicit partial, order.partial event, or clearly incomplete (no cart)
    const derivedPartial = Boolean(isPartial || body?.event === 'order.partial' || !(Array.isArray(body.cart) && body.cart.length > 0));
    body.is_partial = derivedPartial;

    // Validate final payload against pabbly schema (non-blocking)
    if (validatePabbly) {
      try {
        const ok = validatePabbly(body);
        if (!ok) {
          forwarderWarnings.push({ when: new Date().toISOString(), where: 'pabbly.validation', message: 'pabbly validation failed', details: validatePabbly.errors });
          if (DEBUG_FORWARDER) console.warn('forward-order: pabbly validation failed', validatePabbly.errors);
        }
      } catch (e) {
        if (DEBUG_FORWARDER) console.warn('forward-order: pabbly validation error', e && e.message);
      }
    }

    // If still partial (explicit or derived), do NOT forward to Pabbly
    if (derivedPartial) {
      return res.status(200).json({ ok: true, partial: true, normalized: body, warnings: forwarderWarnings });
    }

    // Forward to Pabbly for full submissions
    // Treat 'cart' as the external source of truth; strip internal 'items' to avoid duplication/confusion downstream
    const outbound = (() => { const o = { ...body }; try { delete o.items; } catch {} return o; })();
    const r = await fetch(pabblyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outbound),
    });

    const text = await r.text().catch(() => '');
    if (process.env.DEBUG_FORWARDER === '1') {
      try { console.log('forward-order -> pabbly', { url: pabblyUrl, status: r.status, bodySnippet: text && text.slice ? text.slice(0,400) : String(text).slice(0,400) }); } catch (e) {}
    }

    if (!r.ok) {
      return res.status(502).json({ ok: false, status: r.status, body: text });
    }

    return res.status(200).json({ ok: true, status: r.status, body: text });
  } catch (err) {
    // log server-side
    // eslint-disable-next-line no-console
    console.error('forward-order error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
