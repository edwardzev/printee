import { json as parseJson } from 'micro';

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

  let body = {};
  try { body = await parseJson(req); } catch (e) { body = req.body || {}; }

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
