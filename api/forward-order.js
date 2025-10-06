import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import normalize from '../src/lib/normalizeOrderPayload.js';
import { uploadBuffer, createSharedLink, createFolder } from '../src/lib/dropboxClient.js';
import { ensureOrderRecord, airtableEnabled } from '../src/lib/airtableClient.js';

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

const ajv = new Ajv({ allErrors: true, strict: false });
// Enable standard string formats like date-time, email, uri, etc.
addFormats(ajv);
const validate = orderSchema ? ajv.compile(orderSchema) : null;

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
    // log normalized body snippet
  if (DEBUG_FORWARDER) console.log('forward-order normalized body snippet:', JSON.stringify(body).slice(0, 1000));

    if (validate) {
      const valid = validate(body);
      if (!valid) {
        console.warn('forward-order validation failed', validate.errors);
        return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors, normalized: body });
      }
    }

    // Forward to Pabbly
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
