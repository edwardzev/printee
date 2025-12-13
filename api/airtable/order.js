// Upsert a draft order in Airtable by idempotency key (no PII at this stage)
// Env required in production (supports both new and legacy names):
// - AIRTABLE_API_KEY or AIRTABLE_TOKEN: Personal Access Token with base/table access
// - AIRTABLE_BASE_ID: Airtable Base ID (appXXXXXXXXXXXXXX)
// - AIRTABLE_ORDERS_TABLE or AIRTABLE_TABLE_ORDERS: Table name (e.g., Orders)
// Optional envs:
// - AIRTABLE_FIELD_IDEMPOTENCY_KEY (default: IdempotencyKey)
// - AIRTABLE_FIELD_STATUS (default: Status)
// - AIRTABLE_STATUS_DRAFT (default: draft)

const API_URL = 'https://api.airtable.com/v0';
const DROPBOX_OAUTH_URL = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_API_URL = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_API_URL = 'https://content.dropboxapi.com/2';

function getEnv() {
  return {
    token: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    table: process.env.AIRTABLE_ORDERS_TABLE || process.env.AIRTABLE_TABLE_ORDERS || '',
    fIdem: process.env.AIRTABLE_FIELD_IDEMPOTENCY_KEY || 'IdempotencyKey',
    fGclid: process.env.AIRTABLE_FIELD_GCLID || 'gclid',
    fCampaign: process.env.AIRTABLE_FIELD_CAMPAIGN || 'campaign',
    fSearch: process.env.AIRTABLE_FIELD_SEARCH || 'search',
    fDevice: process.env.AIRTABLE_FIELD_DEVICE || 'device',
    fStatus: process.env.AIRTABLE_FIELD_STATUS || '',
    statusDraft: process.env.AIRTABLE_STATUS_DRAFT || '',
    // Long-text JSON fields
    fCartText: process.env.AIRTABLE_FIELD_CART_TEXT || 'cart_text',
    fCustomerText: process.env.AIRTABLE_FIELD_CUSTOMER_TEXT || 'customer_text',
    fFinanceText: process.env.AIRTABLE_FIELD_FINANCE_TEXT || 'finance_text',
    fActionLog: process.env.AIRTABLE_FIELD_ACTION_LOG || 'Customer Action Log',
    fConversionTime: process.env.AIRTABLE_FIELD_CONVERSION_TIME || 'conversion_time',
    fPaid: process.env.AIRTABLE_FIELD_PAID || 'paid',
    fInvrecNum: process.env.AIRTABLE_FIELD_INVREC_NUM || 'invrec_num',
    fInvrecLink: process.env.AIRTABLE_FIELD_INVREC_LINK || 'invrec_link',
    // Worksheet attachment field (expects array of {url, filename})
    fWorksheet: process.env.AIRTABLE_FIELD_WORKSHEET || 'worksheet',
    // Dropbox
    dbxAppKey: process.env.DROPBOX_APP_KEY || '',
    dbxAppSecret: process.env.DROPBOX_APP_SECRET || '',
    dbxRefreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
    dbxBaseFolder: process.env.DROPBOX_BASE_FOLDER || '',
    dbxNamespaceId: process.env.DROPBOX_NAMESPACE_ID || '',
  };
}

function normalizeDropboxFileForAttachment(link) {
  // Ensure the URL forces a download (dl=1) so Airtable presents it nicely as an attachment
  try {
    if (!link) return link;
    const s = String(link);
    // If it's already a Dropboxusercontent direct host, append dl=1 if missing
    try {
      const u = new URL(s);
      u.searchParams.delete('raw');
      u.searchParams.set('dl', '1');
      return u.toString();
    } catch {
      // fallback string manipulation
      if (s.includes('?dl=1') || s.includes('&dl=1')) return s;
      if (s.includes('?')) return s + '&dl=1';
      return s + '?dl=1';
    }
  } catch {
    try {
      const s = String(link || '');
      if (s.includes('?dl=1') || s.includes('&dl=1')) return s;
      return s + (s.includes('?') ? '&dl=1' : '?dl=1');
    } catch { return link; }
  }
}

function normalizeDropboxFolderView(link) {
  // Keep folder link as view (dl=0) to avoid auto-zipping
  try {
    if (!link) return link;
    const u = new URL(String(link));
    // Ensure it's a folder-style path; regardless, set dl=0
    u.searchParams.set('dl', '0');
    return u.toString();
  } catch {
    try {
      const s = String(link);
      if (s.includes('?dl=1')) return s.replace('?dl=1', '?dl=0');
      if (s.includes('&dl=1')) return s.replace('&dl=1', '&dl=0');
      return s + (s.includes('?') ? '&dl=0' : '?dl=0');
    } catch { return link; }
  }
}

function normalizeDropboxFileRaw(link) {
  // Prefer raw=1 for direct file content (avoids zip packaging behavior)
  try {
    if (!link) return link;
    const s = String(link);
    // If it's already a temporary/direct link (dropboxusercontent or contains raw=1), return as-is
    if (s.includes('dropboxusercontent.com') || s.includes('raw=1') || s.includes('dl=0') || s.includes('raw=1')) return s;
    try {
      const u = new URL(s);
      u.searchParams.delete('dl');
      u.searchParams.set('raw', '1');
      return u.toString();
    } catch {
      return s;
    }
  } catch {
    try {
      const s = String(link);
      if (s.includes('dropboxusercontent.com') || s.includes('raw=1')) return s;
      const noDl = s.replace('?dl=1', '').replace('?dl=0', '').replace('&dl=1', '').replace('&dl=0', '');
      return noDl + (noDl.includes('?') ? '&raw=1' : '?raw=1');
    } catch { return link; }
  }
}

function formatPrimitiveForAirtable(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    if (!value.trim()) return '""';
    return value.replace(/\r?\n/g, '\\n');
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '0';
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function formatValueForAirtable(value, depth = 0) {
  const indent = '  '.repeat(depth);
  const lines = [];

  if (Array.isArray(value)) {
    if (!value.length) {
      lines.push(`${indent}(none)`);
      return lines;
    }
    for (const entry of value) {
      const childLines = formatValueForAirtable(entry, depth + 1);
      if (!childLines.length) continue;
      const [first, ...rest] = childLines;
      lines.push(`${indent}- ${first.trimStart()}`);
      for (const remainder of rest) {
        lines.push(remainder);
      }
    }
    return lines;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) {
      lines.push(`${indent}(empty)`);
      return lines;
    }
    for (const [key, val] of entries) {
      const childLines = formatValueForAirtable(val, depth + 1);
      if (!childLines.length) {
        lines.push(`${indent}${key}:`);
        continue;
      }
      if (childLines.length === 1) {
        lines.push(`${indent}${key}: ${childLines[0].trimStart()}`);
      } else {
        lines.push(`${indent}${key}:`);
        for (const remainder of childLines) {
          lines.push(remainder);
        }
      }
    }
    return lines;
  }

  lines.push(`${indent}${formatPrimitiveForAirtable(value)}`);
  return lines;
}

function formatForAirtableLongText(value) {
  return formatValueForAirtable(value).join('\n');
}

async function airtableFetchRecord(baseId, table, recordId, token) {
  const url = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`airtable_get_record ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function getDropboxAccessToken({ appKey, appSecret, refreshToken }) {
  const basic = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const resp = await fetch(DROPBOX_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`dropbox_token ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.access_token;
}

async function dropboxCreateFolder({ accessToken, namespaceId, folderPath }) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (namespaceId) {
    headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
  }
  const url = `${DROPBOX_API_URL}/files/create_folder_v2`;
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ path: folderPath, autorename: false }),
  });
  if (resp.ok) return resp.json();
  const errText = await resp.text().catch(() => '');
  // Treat conflict (already exists) as success
  if (resp.status === 409 && /conflict/i.test(errText)) {
    return { ok: true, conflict: true };
  }
  throw new Error(`dropbox_create_folder ${resp.status}: ${errText}`);
}

async function dropboxCreateSharedLink({ accessToken, namespaceId, path }) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (namespaceId) {
    headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
  }
  const url = `${DROPBOX_API_URL}/sharing/create_shared_link_with_settings`;
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ path }) });
  if (resp.ok) {
    const data = await resp.json().catch(() => null);
    const urlOnly = data && data.url ? data.url : null;
    try { console.log('[airtable/order] dropbox created shared link', urlOnly); } catch {}
    return urlOnly;
  }
  // Try to parse error body; Dropbox may return 409 when a shared link already exists and include metadata
  const errText = await resp.text().catch(() => '');
  try {
    const errJson = JSON.parse(errText || '{}');
    const existing = errJson?.error?.shared_link_already_exists?.metadata?.url || errJson?.shared_link_already_exists?.metadata?.url;
    if (existing) {
      try { console.log('[airtable/order] dropbox shared link already existed', existing); } catch {}
      return existing;
    }
  } catch (e) {
    // fallthrough to throw below
  }
  throw new Error(`dropbox_create_shared_link ${resp.status}: ${errText}`);
}

async function dropboxGetTemporaryLink({ accessToken, namespaceId, path }) {
  // Returns a direct content URL for a file (best for serving PDFs)
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (namespaceId) headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
  const url = `${DROPBOX_API_URL}/files/get_temporary_link`;
  try {
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ path }) });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`dropbox_get_temp_link ${resp.status}: ${text}`);
    }
    const data = await resp.json().catch(() => null);
    // data.link should be a direct link to the file contents
    return data && data.link ? data.link : null;
  } catch (e) {
    try { console.warn('[airtable/order] dropbox get_temporary_link failed', e?.message || String(e)); } catch {}
    return null;
  }
}

async function dropboxUploadFile({ accessToken, namespaceId, path, content, mode = { '.tag': 'add' }, autorename = false, mute = false }) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/octet-stream',
    'Dropbox-API-Arg': JSON.stringify({ path, mode, autorename, mute }),
  };
  if (namespaceId) {
    headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
  }
  const url = `${DROPBOX_CONTENT_API_URL}/files/upload`;
  const resp = await fetch(url, { method: 'POST', headers, body: content });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    if (resp.status === 409 && /conflict/i.test(text || '')) {
      return { ok: true, conflict: true };
    }
    throw new Error(`dropbox_upload ${resp.status}: ${text}`);
  }
  return resp.json();
}

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
  // data:[<mediatype>][;base64],<data>
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

function composeUploadFilename({ orderId, areaKey, method, product, colors, color, qty, ext }) {
  const colorsPart = (() => {
    if (Array.isArray(colors) && colors.length) {
      return colors.map((c) => sanitizeSegment(c)).filter(Boolean).join('_');
    }
    if (typeof colors === 'string' && colors.trim()) {
      return colors.split(/[\s,;]+/).map((c) => sanitizeSegment(c)).filter(Boolean).join('_');
    }
    if (color) return sanitizeSegment(color);
    return '';
  })();
  const parts = [
    sanitizeSegment(orderId),
    sanitizeSegment(areaKey),
    sanitizeSegment(method),
    sanitizeSegment(product),
    colorsPart,
    sanitizeSegment(qty),
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
    try { return JSON.parse(raw); } catch { return {}; }
  } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const body = await readJson(req);
  const idempotency_key = String(body.idempotency_key || '').trim();
  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  const gclid = typeof body.gclid === 'string' ? body.gclid.trim() : '';
  const campaign = typeof body.campaign === 'string' ? body.campaign.trim() : '';
  const search = typeof body.search === 'string' ? body.search.trim() : '';
  const device = typeof body.device === 'string' ? body.device.trim() : '';
  const customer = (body.customer && typeof body.customer === 'object') ? body.customer : null;
  const financial = (body.financial && typeof body.financial === 'object') ? body.financial : null;
  const cart = (body.cart && typeof body.cart === 'object') ? body.cart : null;
  const cartUploads = Array.isArray(body.cartUploads) ? body.cartUploads : [];
  const customerActionLog = typeof body.customerActionLog === 'string' ? body.customerActionLog.trim() : '';
  const conversionTime = typeof body.conversion_time === 'string' ? body.conversion_time.trim() : '';
  if (!idempotency_key || idempotency_key.length < 6) {
    return res.status(400).json({ ok: false, error: 'invalid_idempotency_key' });
  }

  const { token, baseId, table, fIdem, fGclid, fCampaign, fSearch, fDevice, fStatus, statusDraft, fCartText, fCustomerText, fFinanceText, fPaid, fInvrecNum, fInvrecLink, fWorksheet, dbxAppKey, dbxAppSecret, dbxRefreshToken, dbxBaseFolder, dbxNamespaceId } = getEnv();
  try {
    console.log('[airtable/order] invoked', {
      baseId: baseId ? `${baseId}` : '(missing)',
      table: table ? `${table}` : '(missing)',
      idempotency_key_tail: idempotency_key.slice(-6),
    });
  } catch {}
  if (!token || !baseId || !table) {
    // Graceful no-op when not configured (dev/local)
    try { console.log('[airtable/order] skipped due to missing config'); } catch {}
    return res.status(200).json({ ok: true, skipped: true, reason: 'missing_airtable_config' });
  }

  try {
    const url = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`;
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: [fIdem] },
        records: [
          {
            fields: (() => {
              const f = { [fIdem]: idempotency_key };
              if (fStatus && statusDraft) f[fStatus] = statusDraft;
              return f;
            })(),
          },
        ],
        typecast: true,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      try { console.error('[airtable/order] airtable_error', resp.status, String(text).slice(0, 200)); } catch {}
      return res.status(resp.status).json({ ok: false, error: 'airtable_error', details: text });
    }
    const data = await resp.json();
    const rec = (data.records && data.records[0]) || null;
    try { console.log('[airtable/order] upserted', { recordId: rec?.id, created: !!rec?.created }); } catch {}

    // Try to get Order_id from returned fields or fetch full record
    let orderId = rec?.fields?.Order_id || rec?.fields?.order_id;
    if (!orderId && rec?.id) {
      try {
        const full = await airtableFetchRecord(baseId, table, rec.id, token);
        orderId = full?.fields?.Order_id || full?.fields?.order_id;
      } catch (e) {
        try { console.warn('[airtable/order] fetch full record failed', e?.message || String(e)); } catch {}
      }
    }

    // Always apply payment confirmation fields (paid, invrec_num) regardless of Dropbox configuration
    try {
      const paidPatch = {};
      if (financial) {
        const isPaymentConfirmation = (financial.paid === true || financial.paid === 'true' || financial.paid === 1);
        if (isPaymentConfirmation && fPaid) paidPatch[fPaid] = true;
        if (isPaymentConfirmation && financial.invrec && typeof financial.invrec === 'object') {
          if (fInvrecNum && financial.invrec.docnum != null) paidPatch[fInvrecNum] = String(financial.invrec.docnum);
          if (fInvrecLink && financial.invrec.link) paidPatch[fInvrecLink] = String(financial.invrec.link);
        }
      }
      if (Object.keys(paidPatch).length > 0 && rec?.id) {
        const patchUrl = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(rec.id)}`;
        const patchResp = await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: paidPatch, typecast: true }),
        });
        if (!patchResp.ok) {
          const tx = await patchResp.text().catch(() => '');
          try { console.error('[airtable/order] payment patch error', patchResp.status, String(tx).slice(0, 200)); } catch {}
        } else {
          try { console.log('[airtable/order] patched payment fields', Object.keys(paidPatch)); } catch {}
        }
      }
    } catch (e) {
      try { console.error('[airtable/order] payment patch exception', e?.message || String(e)); } catch {}
    }

  // Dropbox folder creation if configured. Prefer Order_id; fallback to idempotency_key so files still get uploaded.
  let dropbox = null;
  const folderKey = orderId || idempotency_key;
  if (dbxAppKey && dbxAppSecret && dbxRefreshToken && folderKey) {
      try {
        const accessToken = await getDropboxAccessToken({ appKey: dbxAppKey, appSecret: dbxAppSecret, refreshToken: dbxRefreshToken });
        const base = (dbxBaseFolder || '').trim();
        const normalizedBase = base ? (base.startsWith('/') ? base : `/${base}`) : '';
        // Create base folder if provided (best-effort)
        if (normalizedBase) {
          try { await dropboxCreateFolder({ accessToken, namespaceId: dbxNamespaceId, folderPath: normalizedBase }); } catch (e) {}
        }
  const subPath = `${normalizedBase}/${String(folderKey)}`.replace(/\/+/, '/');
        const result = await dropboxCreateFolder({ accessToken, namespaceId: dbxNamespaceId, folderPath: subPath });
  dropbox = { path: subPath, created: !result?.conflict, existed: !!result?.conflict };
        try { console.log('[airtable/order] dropbox folder', dropbox); } catch {}

        // Create a public shared link for this folder and attach only the URL
        try {
          const sharedUrl = await dropboxCreateSharedLink({ accessToken, namespaceId: dbxNamespaceId, path: subPath });
          if (sharedUrl) dropbox.shared_link = sharedUrl;
        } catch (e) {
          try { console.warn('[airtable/order] dropbox shared link failed', e?.message || String(e)); } catch {}
        }

        // If uploads were provided, upload them now
        let uploadedCount = 0;
        let failed = [];
        const worksheetLinks = {}; // { productSku: url }
        if (Array.isArray(uploads) && uploads.length) {
          for (const u of uploads) {
            try {
              const areaKey = String(u.areaKey || u.print_area || '') || 'area';
              const method = String(u.method || u.print_type || 'print');
              const product = String(u.product || u.productSku || '').trim() || 'product';
              const colors = Array.isArray(u.colors) ? u.colors : (typeof u.colors === 'string' ? u.colors : (u.color ? [u.color] : []));
              const qty = Number.isFinite(u.qty) ? u.qty : parseInt(u.qty, 10) || 0;
              const dataUrl = String(u.dataUrl || u.url || '');
              const name = String(u.fileName || u.name || '');
              const { mime, buffer } = parseDataUrl(dataUrl);
              if (!buffer || !buffer.length) throw new Error('invalid_data_url');
              const isWorksheet = (method === 'worksheet' || areaKey === 'worksheet');
              // Allow PDF for worksheet, else fall back to PNG
              const extFromMime = getExtFromMime(mime);
              const extRaw = isWorksheet ? (extFromMime === 'pdf' ? 'pdf' : 'pdf') : (extFromMime || getExtFromName(name) || 'bin');
              const filename = isWorksheet
                ? `WS-${sanitizeSegment(folderKey)}-${sanitizeSegment(product)}.${extRaw}`
                : composeUploadFilename({ orderId: folderKey, areaKey, method, product, colors, qty, ext: extRaw });
              const filePath = `${subPath}/${filename}`.replace(/\/+/, '/');
              await dropboxUploadFile({ accessToken, namespaceId: dbxNamespaceId, path: filePath, content: buffer, mode: isWorksheet ? { '.tag': 'overwrite' } : { '.tag': 'add' }, autorename: false, mute: true });
              uploadedCount += 1;
              // For the worksheet, also create/get a shared link to the file itself for Airtable
              if (isWorksheet && !worksheetLinks[product]) {
                try {
                  // Prefer temporary link (direct file content). Fall back to shared link.
                  let link = await dropboxGetTemporaryLink({ accessToken, namespaceId: dbxNamespaceId, path: filePath });
                  if (!link) link = await dropboxCreateSharedLink({ accessToken, namespaceId: dbxNamespaceId, path: filePath });
                  if (link) worksheetLinks[product] = link;
                } catch (_) {}
              }
            } catch (e) {
              try { failed.push({ name: u?.fileName || u?.name || null, error: e?.message || String(e) }); } catch {}
            }
          }
        }
        if (uploadedCount || (failed && failed.length)) {
          dropbox.uploads = { uploaded: uploadedCount, failedCount: (failed && failed.length) || 0, failed };
          if (Object.keys(worksheetLinks).length) dropbox.worksheet_links = worksheetLinks;
          try { console.log('[airtable/order] dropbox uploads', dropbox.uploads); } catch {}
        }

        // If details provided, patch Airtable with JSON blocks into 3 long-text fields
        const patchFields = {};
        try {
          if (fCustomerText && customer) {
            patchFields[fCustomerText] = formatForAirtableLongText({
              name: customer.name || '',
              phone: customer.phone || '',
              email: customer.email || '',
              address_street: customer.address_street || customer.adress_street || '',
              address_city: customer.address_city || customer.adres_city || '',
            });
          }
          if (fGclid && gclid) {
            patchFields[fGclid] = gclid;
          }
          if (fCampaign && campaign) {
            patchFields[fCampaign] = campaign;
          }
          if (fSearch && search) {
            patchFields[fSearch] = search;
          }
          if (fDevice && device) {
            patchFields[fDevice] = device;
          }
          if (financial) {
            const isPaymentConfirmation = (financial.paid === true || financial.paid === 'true' || financial.paid === 1);
            if (isPaymentConfirmation) {
              // Payment confirmation: only set paid and invrec_num. Do NOT touch finance_text or invrec_link.
              if (fPaid) patchFields[fPaid] = true;
              if (financial.invrec && typeof financial.invrec === 'object') {
                if (fInvrecNum && financial.invrec.docnum != null) patchFields[fInvrecNum] = String(financial.invrec.docnum);
                // Intentionally ignore invrec.link and do not set fInvrecLink
              }
            } else if (fFinanceText) {
              // Initial pre-payment post: write finance_text (totals/method/links) as before
              const financePayload = {
                subtotal: Number(financial.subtotal || 0),
                subtotal_before_discount: Number(financial.subtotal_before_discount || financial.subtotal || 0),
                discount: Number(financial.discount || 0),
                delivery: Number(financial.delivery || 0),
                vat_base: Number(financial.vat_base || 0),
                vat: Number(financial.vat || 0),
                total: Number(financial.total || 0),
                total_after_payment_adjustments: Number(financial.total_after_payment_adjustments || financial.total || 0),
                payment_method: String(financial.payment_method || financial.paymentMethod || ''),
              };
              if (financial.currency) financePayload.currency = String(financial.currency);
              if (Array.isArray(financial.line_items)) financePayload.line_items = financial.line_items;
              if (financial.totals_breakdown && typeof financial.totals_breakdown === 'object') {
                financePayload.totals_breakdown = financial.totals_breakdown;
              }
              if (financial.payment_adjustments) {
                financePayload.payment_adjustments = financial.payment_adjustments;
              }
              if (Array.isArray(financial.breakdown_lines)) {
                financePayload.breakdown_lines = financial.breakdown_lines;
              }
              if (financial.dropbox_shared_link) {
                financePayload.dropbox_shared_link = normalizeDropboxFolderView(String(financial.dropbox_shared_link));
              }
              if (!financePayload.dropbox_shared_link && dropbox && dropbox.shared_link) {
                financePayload.dropbox_shared_link = normalizeDropboxFolderView(String(dropbox.shared_link));
              }
              if (financial.dropbox_worksheet_link) {
                financePayload.dropbox_worksheet_link = normalizeDropboxFileRaw(String(financial.dropbox_worksheet_link));
              }
              if (financial.dropbox_worksheet_links && typeof financial.dropbox_worksheet_links === 'object') {
                const norm = {};
                for (const [k, v] of Object.entries(financial.dropbox_worksheet_links)) norm[k] = normalizeDropboxFileRaw(String(v));
                financePayload.dropbox_worksheet_links = norm;
              }
              if (!financePayload.dropbox_worksheet_links && dropbox && dropbox.worksheet_links) {
                const norm = {};
                for (const [k, v] of Object.entries(dropbox.worksheet_links)) norm[k] = normalizeDropboxFileRaw(String(v));
                financePayload.dropbox_worksheet_links = norm;
              }
              if (!financePayload.dropbox_worksheet_link && financePayload.dropbox_worksheet_links) {
                const keys = Object.keys(financePayload.dropbox_worksheet_links);
                if (keys.length === 1) financePayload.dropbox_worksheet_link = financePayload.dropbox_worksheet_links[keys[0]];
              }
              // Ignore invrec in pre-payment stage; it isn't present yet
              const structuredText = formatForAirtableLongText(financePayload);
              if (financial.breakdown_text) {
                const lines = String(financial.breakdown_text || '').trim();
                patchFields[fFinanceText] = lines
                  ? `${lines}${structuredText ? `\n\n---\n${structuredText}` : ''}`
                  : structuredText;
              } else {
                patchFields[fFinanceText] = structuredText;
              }
            }
          }
          if (fCartText && (cart || (Array.isArray(cartUploads) && cartUploads.length))) {
            const payload = {
              items: Array.isArray(cart?.items) ? cart.items : [],
              files: [],
            };
            if (Array.isArray(cartUploads)) {
              payload.files = cartUploads.map((u) => {
                const areaKey = String(u.areaKey || u.print_area || 'area');
                const method = String(u.method || u.print_type || 'print');
                const product = String(u.product || u.productSku || 'product');
                const colors = Array.isArray(u.colors) ? u.colors : (u.color ? [u.color] : []);
                const qty = Number.isFinite(u.qty) ? u.qty : parseInt(u.qty, 10) || 0;
                const isWorksheet = (method === 'worksheet' || areaKey === 'worksheet');
                const ext = isWorksheet ? 'pdf' : (getExtFromName(u.fileName || '') || 'png');
                const fileName = isWorksheet ? `WS-${orderId}-${sanitizeSegment(product)}.${ext}` : composeUploadFilename({ orderId, areaKey, method, product, colors, qty, ext });
                const path = `${subPath}/${fileName}`.replace(/\/+/, '/');
                return { areaKey, method, product, colors, qty, fileName, path };
              });
            }
            patchFields[fCartText] = formatForAirtableLongText(payload);
          }
          if (fConversionTime && conversionTime) {
            patchFields[fConversionTime] = conversionTime;
          }
          if (fActionLog && customerActionLog) {
            patchFields[fActionLog] = customerActionLog;
          }

          // If configured, add worksheet attachments to the dedicated Airtable attachment field.
          try {
            const wsSource = (financial && financial.dropbox_worksheet_links && typeof financial.dropbox_worksheet_links === 'object')
              ? financial.dropbox_worksheet_links
              : (dropbox && dropbox.worksheet_links && typeof dropbox.worksheet_links === 'object') ? dropbox.worksheet_links : null;
            if (fWorksheet && wsSource && typeof wsSource === 'object') {
              const attachments = [];
              for (const [productSku, urlRaw] of Object.entries(wsSource)) {
                try {
                  const url = normalizeDropboxFileForAttachment(String(urlRaw));
                  const filename = `WS-${sanitizeSegment(folderKey)}-${sanitizeSegment(productSku)}.pdf`;
                  attachments.push({ url, filename });
                } catch (e) {
                  try { console.warn('[airtable/order] worksheet attachment build failed', e?.message || String(e)); } catch {}
                }
              }
              if (attachments.length) patchFields[fWorksheet] = attachments;
            }
          } catch (e) {
            try { console.warn('[airtable/order] worksheet attachments build exception', e?.message || String(e)); } catch {}
          }
        } catch (e) {
          try { console.warn('[airtable/order] JSON patch build failed', e?.message || String(e)); } catch {}
        }

        if (Object.keys(patchFields).length > 0 && rec?.id) {
          try {
            const patchUrl = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(rec.id)}`;
            const patchResp = await fetch(patchUrl, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ fields: patchFields, typecast: true }),
            });
            if (!patchResp.ok) {
              const tx = await patchResp.text().catch(() => '');
              try { console.error('[airtable/order] patch error', patchResp.status, String(tx).slice(0, 200)); } catch {}
            } else {
              try { console.log('[airtable/order] patched fields', Object.keys(patchFields)); } catch {}
            }
          } catch (e) {
            try { console.error('[airtable/order] patch exception', e?.message || String(e)); } catch {}
          }
        }
      } catch (e) {
        try { console.error('[airtable/order] dropbox error', e?.message || String(e)); } catch {}
      }
    } else {
      try { console.log('[airtable/order] dropbox skipped', { configured: !!(dbxAppKey && dbxAppSecret && dbxRefreshToken), haveOrderId: !!orderId }); } catch {}
    }

    return res.status(200).json({ ok: true, record: rec ? { id: rec.id, created: !!rec.created } : null, orderId: orderId || null, dropbox });
  } catch (e) {
    try { console.error('[airtable/order] exception', e?.message || String(e)); } catch {}
    return res.status(500).json({ ok: false, error: 'airtable_exception', details: e?.message || String(e) });
  }
}
