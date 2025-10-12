import fs from 'fs/promises';
import path from 'path';

function sanitizeSegment(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]+/g, '-')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[_\-]+|[_\-]+$/g, '');
}

function getExtFromName(name) {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(String(name || ''));
  return m ? m[1].toLowerCase() : '';
}

function getExtFromMime(mime) {
  if (!mime) return '';
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
  };
  return map[mime] || '';
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return { mime: '', buffer: null };
  const firstComma = dataUrl.indexOf(',');
  if (firstComma === -1) return { mime: '', buffer: null };
  const meta = dataUrl.slice(5, firstComma);
  const data = dataUrl.slice(firstComma + 1);
  const mime = meta.split(';')[0] || '';
  const isBase64 = /;base64/i.test(meta);
  try {
    const buf = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data), 'utf8');
    return { mime, buffer: buf };
  } catch {
    return { mime: '', buffer: null };
  }
}

function composeUploadFilename({ idempotencyKey, areaKey, method, product, colors, color, qty, ext }) {
  const colorsPart = (() => {
    if (Array.isArray(colors) && colors.length) {
      return colors.map((c) => sanitizeSegment(c)).filter(Boolean).join('_');
    }
    if (typeof colors === 'string' && colors.trim()) {
      return colors
        .split(/[\s,;]+/)
        .map((c) => sanitizeSegment(c))
        .filter(Boolean)
        .join('_');
    }
    if (color) return sanitizeSegment(color);
    return '';
  })();
  const parts = [
    'DEV',
    sanitizeSegment(idempotencyKey || 'local'),
    sanitizeSegment(areaKey || 'area'),
    sanitizeSegment(method || 'mockup'),
    sanitizeSegment(product || 'product'),
    colorsPart,
    sanitizeSegment(qty == null ? '' : String(qty)),
  ].filter(Boolean);
  const base = parts.join('_');
  return ext ? `${base}.${ext}` : base;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  // Dev safeguard: only allow when not in production
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return res.status(403).json({ ok: false, error: 'forbidden_in_production' });

  const body = await readJson(req);
  const idempotency_key = String(body.idempotency_key || body.idempotencyKey || '').trim() || `dev_${Date.now()}`;
  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  if (!uploads.length) return res.status(400).json({ ok: false, error: 'no_uploads' });

  try {
    const root = process.cwd();
    const destDir = path.join(root, 'data', 'dev_uploads', sanitizeSegment(idempotency_key));
    await fs.mkdir(destDir, { recursive: true });

    const results = [];
    for (const u of uploads) {
      try {
        const dataUrl = String(u.dataUrl || u.url || '');
        const { mime, buffer } = parseDataUrl(dataUrl);
        if (!buffer || !buffer.length) throw new Error('invalid_data_url');
        const ext = getExtFromName(u.fileName || u.name || '') || getExtFromMime(mime) || 'bin';
        const filename = u.fileName || composeUploadFilename({
          idempotencyKey: idempotency_key,
          areaKey: u.areaKey,
          method: u.method,
          product: u.product || u.productSku,
          colors: u.colors || u.color,
          qty: u.qty,
          ext,
        });
        const filePath = path.join(destDir, filename);
        await fs.writeFile(filePath, buffer);
        results.push({ ok: true, file: path.relative(root, filePath) });
      } catch (e) {
        results.push({ ok: false, error: e?.message || String(e) });
      }
    }

    return res.status(200).json({ ok: true, saved: results, dir: path.relative(root, destDir) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
