#!/usr/bin/env node
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.DEV_API_PORT || 3001;
const PABBLY_URL = process.env.PABBLY_URL || "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY1MDYzZTA0MzU1MjZkNTUzZDUxM2Ii_pc";

const schemaPath = path.resolve(process.cwd(), 'schemas', 'order.schema.json');
let orderSchema = null;
try {
  orderSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (err) {
  console.warn('dev-api: could not load schema', err?.message || err);
}

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = orderSchema ? ajv.compile(orderSchema) : null;
import normalize from './src/lib/normalizeOrderPayload.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadBuffer, createSharedLink } from './src/lib/dropboxClient.js';
import { ensureOrderRecord, airtableEnabled } from './src/lib/airtableClient.js';

app.use(bodyParser.json({ limit: '1mb' }));

// ensure logs dir exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const forwardedLog = path.join(logsDir, 'forwarded.jsonl');
const partialsLog = path.join(logsDir, 'partials.jsonl');

// ensure forwarded log file exists so we can tail it immediately
try { if (!fs.existsSync(forwardedLog)) fs.writeFileSync(forwardedLog, ''); } catch (err) { console.error('dev-api: could not ensure forwarded log exists', err); }

function appendForwardLog(entry) {
  try {
    const line = JSON.stringify(entry);
    fs.appendFileSync(forwardedLog, line + '\n');
  } catch (err) {
    console.error('dev-api: error writing forward log', err);
  }
}

app.post('/api/forward-order', async (req, res) => {
  try {
    const rawBody = req.body;
    // Early normalize to extract order context for Airtable
    const preNormalized = typeof normalize === 'function' ? normalize(rawBody || {}) : (rawBody || {});

    // Ensure Airtable order exists to get a stable order_id for folder naming
  let ensured = { order_id: null, order_number: null, enabled: false };
    try {
      if (airtableEnabled()) {
        ensured = await ensureOrderRecord({
          idempotency_key: preNormalized.idempotency_key,
          order_number: preNormalized?.order?.order_number,
          created_at: preNormalized.created_at
        });
      }
    } catch (e) {
      console.warn('dev-api: airtable ensure failed', e?.message || e);
    }
    // If the payload contains uploadedDesigns data URLs, attempt to upload them to Dropbox now
    async function uploadDataUrlToDropbox(dataUrl, filenameHint) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!m) throw new Error('invalid_data_url');
      const mime = m[1];
      const ext = (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0,8);
      const base64 = m[2];
      const buf = Buffer.from(base64, 'base64');
      const baseFolder = process.env.DROPBOX_FOLDER || '/printee/uploads';
  const folderKey = ensured?.order_number || preNormalized?.order?.order_number || ensured?.order_id || preNormalized?.order?.order_id || null;
  const orderFolder = folderKey ? `${baseFolder}/${folderKey}` : baseFolder;
      const name = `${Date.now()}-${uuidv4()}-${(filenameHint||'file').replace(/[^a-z0-9.\-_]/gi,'')}`;
      const filename = name + (ext ? `.${ext}` : '');
      const dropboxPath = `${orderFolder}/${filename}`;

      await uploadBuffer(buf, dropboxPath);
      const link = await createSharedLink(dropboxPath).catch(()=>null);
      return { url: link || null, path: dropboxPath, name: filename, size: buf.length };
    }

  // scan for data URLs and upload them, replacing with metadata or error
  const bodyCandidate = JSON.parse(JSON.stringify(rawBody || {}));
    const uploads = [];
    function collectAndUpload(obj) {
      if (!obj || typeof obj !== 'object') return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v && typeof v === 'string' && v.startsWith('data:')) {
          uploads.push({ container: obj, key: k, dataUrl: v });
        } else if (Array.isArray(v)) {
          v.forEach((it) => collectAndUpload(it));
        } else if (v && typeof v === 'object') {
          collectAndUpload(v);
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
          console.error('dev-api: dropbox upload failed', e?.message || e);
          up.container[up.key] = { error: String(e?.message || e) };
        }
      }
    }

  // Use the possibly-modified bodyCandidate (with uploaded file metadata) for normalization,
  // then inject ensured.order_id if present so it is consistent everywhere downstream
  const tmp = typeof normalize === 'function' ? normalize(bodyCandidate) : bodyCandidate;
  let normalized = tmp;
  if (normalized?.order) {
    normalized = { ...normalized, order: { ...normalized.order } };
    if (ensured?.enabled && ensured?.order_id) normalized.order.order_id = ensured.order_id;
    if (ensured?.enabled && ensured?.order_number) normalized.order.order_number = String(ensured.order_number);
  }
  if (ensured?.enabled && (ensured?.airtable_record_id || ensured?.order_number)) {
    normalized._airtable = { record_id: ensured.airtable_record_id || ensured.order_id, order_number: ensured.order_number || null };
  }
    // debug: print raw + normalized snippets to help trace validation mismatches
    try { console.log('dev-api: forward-order raw snippet:', JSON.stringify(rawBody).slice(0,1000)); } catch (e) {}
    try { console.log('dev-api: forward-order normalized snippet:', JSON.stringify(normalized).slice(0,1000)); } catch (e) {}
    if (validate) {
      const ok = validate(normalized);
      if (!ok) return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors, normalized });
    }

    // append raw + normalized to local forward log (for dev diagnostics)
    appendForwardLog({ ts: new Date().toISOString(), status: 'queued', raw: rawBody, payload: normalized });

    const r = await fetch(PABBLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    });
    const text = await r.text().catch(()=>'');

  const entry = { ts: new Date().toISOString(), status: r.ok ? 'forwarded' : 'failed', statusCode: r.status, body: text, payload: normalized };
    appendForwardLog(entry);

    if (!r.ok) return res.status(502).json({ ok: false, status: r.status, body: text });
    return res.status(200).json({ ok: true, status: r.status, body: text });
  } catch (err) {
    console.error('dev-api forward-order error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Save partial payloads as users progress (for abandoned carts / in-progress states)
app.post('/api/save-payload', (req, res) => {
  try {
    const normalized = typeof normalize === 'function' ? normalize(req.body) : req.body;
    const entry = { ts: new Date().toISOString(), payload: normalized };
    fs.appendFileSync(partialsLog, JSON.stringify(entry) + '\n');
    return res.json({ ok: true });
  } catch (err) {
    console.error('dev-api save-payload error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

app.get('/api/partials', (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    if (!fs.existsSync(partialsLog)) return res.json({ ok: true, entries: [] });
    const txt = fs.readFileSync(partialsLog, 'utf8');
    const lines = txt.trim().split('\n').filter(Boolean);
    const slice = lines.slice(-limit).map(l => { try { return JSON.parse(l); } catch (e) { return { _raw: l }; } });
    return res.json({ ok: true, entries: slice });
  } catch (err) {
    console.error('dev-api partials read error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Dev API proxy listening on http://localhost:${PORT}`);
});

// expose recent forwarded logs for dev inspection
app.get('/api/forwarded', (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    if (!fs.existsSync(forwardedLog)) return res.json({ ok: true, entries: [] });
    const txt = fs.readFileSync(forwardedLog, 'utf8');
    const lines = txt.trim().split('\n').filter(Boolean);
    const slice = lines.slice(-limit).map(l => {
      try { return JSON.parse(l); } catch (e) { return { _raw: l }; }
    });
    return res.json({ ok: true, entries: slice });
  } catch (err) {
    console.error('dev-api forwarded read error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});
