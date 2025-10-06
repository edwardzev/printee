import { json as parseJson, text as parseText } from 'micro';
import { findOrderBySession, updateOrderRecord, airtableEnabled } from '../../../src/lib/airtableClient.js';

// Minimal iCount IPN handler
// iCount sends POSTs back to our endpoint with payment info. We'll:
// - Parse body (form or JSON)
// - Extract our session id from m__session
// - Find Airtable record by PaymentSession
// - Update a few fields (PaymentStatus, PaymentProvider, Invoice/Receipt numbers, Amount)
// - Always return 200 OK quickly

function parseFormEncoded(body) {
  const params = new URLSearchParams(body || '');
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  // iCount may send application/x-www-form-urlencoded; try to parse both
  let body = {};
  try {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) {
      body = await parseJson(req);
    } else {
      const raw = await parseText(req);
      try { body = parseFormEncoded(raw); } catch { body = {}; }
    }
  } catch (e) {
    body = req.body || {};
  }

  if (process.env.DEBUG_FORWARDER === '1') {
    try { console.log('api/pay/icount/ipn incoming', { bodySnippet: JSON.stringify(body).slice(0, 400) }); } catch {}
  }

  const sessionId = body['m__session'] || body['session'] || body['session_id'] || '';
  const status = body['status'] || body['payment_status'] || '';
  const invoice = body['invoice'] || body['invoice_number'] || body['doc_number'] || '';
  const receipt = body['receipt'] || body['receipt_number'] || '';
  const amount = Number(body['amount'] || body['sum'] || body['cs'] || 0) || 0;

  if (airtableEnabled() && sessionId) {
    try {
      const rec = await findOrderBySession(sessionId).catch(() => null);
      if (rec && rec.id) {
        const fields = {
          PaymentStatus: status || 'paid',
          PaymentProvider: 'iCount',
          PaymentAmount: amount,
          InvoiceNumber: invoice || undefined,
          ReceiptNumber: receipt || undefined
        };
        await updateOrderRecord(rec.id, fields).catch(()=>{});
      }
    } catch (e) {
      if (process.env.DEBUG_FORWARDER === '1') console.warn('ipn airtable update failed', e?.message || e);
    }
  }

  // Always 200 to acknowledge receipt
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
}
