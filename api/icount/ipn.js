// iCount IPN (server-to-server callback) receiver
// Purpose: capture iCount return payload, log it for inspection, and forward
//          paid=true + invrec_num (docnum) to Airtable using our idempotency key.
// Notes:
// - Configure iCount "IPN/Callback URL" to point to: https://<your-host>/api/icount/ipn
// - We expect the idempotency key to be echoed as a custom field m__idem if you passed it
//   when building the payment URL. Some pages might also return "idem".

async function readBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    const ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) {
      try { return { raw, data: JSON.parse(raw) }; } catch { return { raw, data: {} }; }
    }
    if (ct.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw);
      const obj = {};
      for (const [k, v] of params.entries()) obj[k] = v;
      return { raw, data: obj };
    }
    // Fallback: try parse as querystring-like
    const params = new URLSearchParams(raw);
    const obj = {};
    for (const [k, v] of params.entries()) obj[k] = v;
    return { raw, data: obj };
  } catch {
    return { raw: '', data: {} };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const { raw, data } = await readBody(req);
  try {
    console.log('[icount/ipn] headers', req.headers);
    console.log('[icount/ipn] raw', raw);
    console.log('[icount/ipn] parsed', data);
  } catch {}

  // Extract idempotency key and docnum from common iCount names
  const idem = (data && (data['m__idem'] || data['idem'])) ? String(data['m__idem'] || data['idem']).trim() : '';
  const docnum = (data && (data['docnum'] || data['doc'])) ? String(data['docnum'] || data['doc']).trim() : '';

  // Best-effort forwarding to Airtable handler (only sets paid=true and invrec_num)
  try {
    if (idem) {
      const baseUrl = `${(req.headers['x-forwarded-proto'] || 'https')}://${req.headers.host}`;
      const payload = { idempotency_key: idem, financial: { paid: true } };
      if (docnum) payload.financial.invrec = { docnum };
      await fetch(`${baseUrl}/api/airtable/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch (e) {
    try { console.warn('[icount/ipn] forward to airtable failed', e?.message || String(e)); } catch {}
  }

  return res.status(200).json({ ok: true, forwarded: Boolean(idem), has_docnum: Boolean(docnum) });
}
