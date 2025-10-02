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

app.use(bodyParser.json({ limit: '1mb' }));

// ensure logs dir exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const forwardedLog = path.join(logsDir, 'forwarded.jsonl');
const partialsLog = path.join(logsDir, 'partials.jsonl');

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
    if (validate) {
      const ok = validate(req.body);
      if (!ok) return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors });
    }

    // append to local forward log (for dev diagnostics)
    appendForwardLog({ ts: new Date().toISOString(), status: 'queued', payload: req.body });

    const r = await fetch(PABBLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await r.text().catch(()=>'');

    const entry = { ts: new Date().toISOString(), status: r.ok ? 'forwarded' : 'failed', statusCode: r.status, body: text, payload: req.body };
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
    const entry = { ts: new Date().toISOString(), payload: req.body };
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
