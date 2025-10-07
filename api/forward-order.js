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

const DEFAULT_PABBY_URL = "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY1MDYzZTA0MzU1MjZkNTUzZDUxM2Ii_pc";
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
      // Airtable record id (prefer explicit _airtable entry)
      body.airtable_record_id = body._airtable?.record_id || body._airtable?.id || (ensured && (ensured.airtable_record_id || ensured.order_id)) || null;

      // Top-level order_number convenience
      body.order_number = body.order?.order_number || (body._airtable && body._airtable.order_number) || null;

      // Ensure customer block exists and merge contact fields (normalize() already populated customer)
      body.customer = body.customer || {};
      const rawContact = body._app_payload?.contact || {};
      // After normalize(), customer fields are already populated, but ensure contact fields from _app_payload are preserved
      if (!body.customer.contact_name && rawContact.name) body.customer.contact_name = rawContact.name;
      if (!body.customer.email && rawContact.email) body.customer.email = rawContact.email;
      if (!body.customer.phone && rawContact.phone) body.customer.phone = rawContact.phone;
      
      // Promote address into customer.address as a normalized object
      body.customer.address = body.customer.address || {
        line1: body.delivery?.address_line1 || '',
        line2: body.delivery?.address_line2 || '',
        city: body.delivery?.city || '',
        postcode: body.delivery?.postcode || '',
        country: body.delivery?.country || ''
      };

      // CRITICAL FIX: Cart mapping - normalize() creates items, we need cart for Pabbly
      // Use items array as cart, or existing cart if already populated
      if (!Array.isArray(body.cart) && Array.isArray(body.items)) {
        body.cart = [...body.items]; // Copy items to cart
      } else if (!Array.isArray(body.cart)) {
        body.cart = [];
      }

      // Coerce numeric fields in cart items where possible
      body.cart = body.cart.map((it, idx) => {
        const item = (typeof it === 'string') ? (() => { try { return JSON.parse(it); } catch { return { name: String(it) }; } })() : (it || {});
        // ensure keys
        item.line_id = item.line_id || item.id || `line-${idx}`;
        item.product_name = item.product_name || (item.product && (item.product.name || item.productName)) || item.name || '';
        item.sku = item.sku || item.product_sku || (item.product && item.product.sku) || '';
        item.quantity = Number(item.quantity || item.qty || 0) || 0;
        item.unit_price = Number(item.unit_price || item.price || item.unitPrice || 0) || 0;
        item.line_total = Number(item.line_total || item.totalPrice || item.unit_price * item.quantity || 0) || 0;
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

      // Finance block: use existing normalized totals preferentially, fallback to computation
      // normalize() already computed these correctly from cartSummary and cart items
      const subtotal = Number(body.order?.totals?.subtotal) || 0;
      const deliveryCost = Number(body.order?.totals?.delivery) || 0;
      const vatPercent = Number(body.order?.totals?.vat_percent) || 17;
      const vatAmount = Number(body.order?.totals?.vat_amount) || 0;
      const grandTotal = Number(body.order?.totals?.grand_total) || 0;

      // Ensure body.order.totals exists with numeric values
      body.order = body.order || {};
      body.order.totals = body.order.totals || {};
      body.order.totals.subtotal = subtotal;
      body.order.totals.delivery = deliveryCost;
      body.order.totals.vat_percent = vatPercent;
      body.order.totals.vat_amount = vatAmount;
      body.order.totals.grand_total = grandTotal;

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
      body.is_partial = Boolean(isPartial);
      
      // Ensure backward compatibility: map cart to items if items missing
      if (Array.isArray(body.cart) && !Array.isArray(body.items)) {
        body.items = [...body.cart];
      }
    } catch (e) {
      if (DEBUG_FORWARDER) console.warn('forward-order: canonicalization error', e && (e.message || e));
    }

    if (validate) {
      // Skip original validation if we have canonical fields (they may not match the old schema)
      const hasCanonicalFields = body.airtable_record_id || body.finance || body.dropbox_folder_url !== undefined;
      if (!hasCanonicalFields) {
        const valid = validate(body);
        if (!valid) {
          console.warn('forward-order validation failed', validate.errors);
          if (DEBUG_FORWARDER) console.log('forward-order: validation failed on body:', JSON.stringify(body).slice(0, 2000));
          return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors, normalized: body });
        }
      } else {
        if (DEBUG_FORWARDER) console.log('forward-order: skipping original schema validation due to canonical fields');
      }
    }

    // In partial mode, skip forwarding to Pabbly — just acknowledge after uploads/Airtable
    if (isPartial) {
      return res.status(200).json({ ok: true, partial: true, normalized: body, warnings: forwarderWarnings });
    }

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

    // Forward to Pabbly for full submissions
    if (DEBUG_FORWARDER) console.log('forward-order: sending to pabbly - canonical fields check:', { 
      airtable_record_id: body.airtable_record_id,
      order_number: body.order_number,
      customer_name: body.customer?.contact_name,
      cart_length: body.cart?.length,
      finance_total: body.finance?.grand_total,
      dropbox_url: body.dropbox_folder_url
    });
    
    const r = await fetch(pabblyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
