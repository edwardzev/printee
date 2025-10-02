import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

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
    const body = req.body;

    if (validate) {
      const valid = validate(body);
      if (!valid) {
        return res.status(400).json({ ok: false, error: 'validation_failed', details: validate.errors });
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
