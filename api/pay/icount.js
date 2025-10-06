const ICOUNT_PAGE_ID = process.env.ICOUNT_PAGE_ID || process.env.ICOUNT_CC_PAGE_ID || process.env.ICOUNT_MPAGE || '6fa96';
const ICOUNT_URL = process.env.ICOUNT_URL || `https://app.icount.co.il/m/${ICOUNT_PAGE_ID}`;

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  // Parse both JSON and x-www-form-urlencoded bodies without external deps
  async function readRaw(req) {
    return await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => { data += c; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  let body = {};
  try {
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) {
      const raw = await readRaw(req);
      try { body = JSON.parse(raw || '{}'); } catch { body = {}; }
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const raw = await readRaw(req);
      const params = new URLSearchParams(raw || '');
      const out = {};
      for (const [k, v] of params.entries()) out[k] = v;
      body = out;
    } else {
      // Fallback to req.body if framework provided it
      body = req.body || {};
    }
  } catch (e) {
    body = req.body || {};
  }
  if (process.env.DEBUG_FORWARDER === '1') {
    try { console.log('api/pay/icount incoming', { method: req.method, url: req.url, bodySnippet: JSON.stringify(body).slice(0,400) }); } catch (e) {}
  }

  // Build inputs from body
  const inputs = Object.keys(body || {}).map(k => {
    const v = body[k];
    return `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}" />`;
  }).join('\n');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Redirecting to payment provider...</p><form id="payform" action="${escapeHtml(ICOUNT_URL)}" method="POST">${inputs}<noscript><p>Please click continue</p><button type="submit">Continue</button></noscript></form><script>document.getElementById('payform').submit();</script></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = 200;
  res.end(html);
}
