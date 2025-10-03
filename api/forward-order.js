import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import normalize from '../src/lib/normalizeOrderPayload.js';
import { uploadBuffer, createSharedLink } from '../src/lib/dropboxClient.js';

// Hardcoded Dropbox uploads base folder (per request)
const DROPBOX_BASE_FOLDER = '/Dropbox/Print Market Team Folder/printeam/printeam_orders';

const DEFAULT_PABBY_URL = "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY1MDYzZTA0MzU1MjZkNTUzZDUxM2Ii_pc";

const schemaPath = path.resolve(process.cwd(), 'schemas', 'order.schema.json');
let orderSchema = null;
try {
  orderSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Could not load schema for payload validation', err?.message || err);
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = orderSchema ? ajv.compile(orderSchema) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const pabblyUrl = process.env.PABBLY_URL || DEFAULT_PABBY_URL;

  try {
    const appBody = req.body;
    // log incoming raw body for tracing (serverless logs)
    console.log('forward-order incoming raw body:', JSON.stringify(appBody).slice(0, 1000));
    // If the payload contains uploadedDesigns with data URLs, upload them to Dropbox now
    async function uploadDataUrlToDropbox(dataUrl, filenameHint) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!m) throw new Error('invalid_data_url');
      const mime = m[1];
      const ext = (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0,8);
      const base64 = m[2];
      const buf = Buffer.from(base64, 'base64');

  const baseFolder = DROPBOX_BASE_FOLDER || '/printee/uploads';
      const orderNumber = (appBody && appBody.order && (appBody.order.order_number || appBody.orderNumber)) || null;
      const orderFolder = orderNumber ? `${baseFolder}/${orderNumber}` : baseFolder;
      const name = `${Date.now()}-${uuidv4()}-${(filenameHint||'file').replace(/[^a-z0-9.\-_]/gi,'')}`;
      const filename = name + (ext ? `.${ext}` : '');
      const dropboxPath = `${orderFolder}/${filename}`;

      await uploadBuffer(buf, dropboxPath);
      const link = await createSharedLink(dropboxPath).catch(()=>null);
      return { url: link || null, path: dropboxPath, name: filename, size: buf.length };
    }

    // scan uploadedDesigns at top-level and inside cart items for data URLs and upload them
    const bodyCandidate = JSON.parse(JSON.stringify(appBody || {}));
  const uploads = [];
  const forwarderWarnings = [];
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

    // Attach warnings into the candidate so normalize can carry them into the final payload
    if (forwarderWarnings.length) bodyCandidate._forwarder_warnings = forwarderWarnings;

    const body = typeof normalize === 'function' ? normalize(bodyCandidate) : bodyCandidate;
    // log normalized body snippet
    console.log('forward-order normalized body snippet:', JSON.stringify(body).slice(0, 1000));

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
