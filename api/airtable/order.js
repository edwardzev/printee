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
    fStatus: process.env.AIRTABLE_FIELD_STATUS || '',
    statusDraft: process.env.AIRTABLE_STATUS_DRAFT || '',
  // Long-text JSON fields
  fCartText: process.env.AIRTABLE_FIELD_CART_TEXT || 'cart_text',
  fCustomerText: process.env.AIRTABLE_FIELD_CUSTOMER_TEXT || 'customer_text',
  fFinanceText: process.env.AIRTABLE_FIELD_FINANCE_TEXT || 'finance_text',
  fPaid: process.env.AIRTABLE_FIELD_PAID || 'paid',
  fInvrecNum: process.env.AIRTABLE_FIELD_INVREC_NUM || 'invrec_num',
  fInvrecLink: process.env.AIRTABLE_FIELD_INVREC_LINK || 'invrec_link',
    // Dropbox
    dbxAppKey: process.env.DROPBOX_APP_KEY || '',
    dbxAppSecret: process.env.DROPBOX_APP_SECRET || '',
    dbxRefreshToken: process.env.DROPBOX_REFRESH_TOKEN || '',
    dbxBaseFolder: process.env.DROPBOX_BASE_FOLDER || '',
    dbxNamespaceId: process.env.DROPBOX_NAMESPACE_ID || '',
  };
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
  const customer = (body.customer && typeof body.customer === 'object') ? body.customer : null;
  const financial = (body.financial && typeof body.financial === 'object') ? body.financial : null;
  const cart = (body.cart && typeof body.cart === 'object') ? body.cart : null;
  const cartUploads = Array.isArray(body.cartUploads) ? body.cartUploads : [];
  if (!idempotency_key || idempotency_key.length < 6) {
    return res.status(400).json({ ok: false, error: 'invalid_idempotency_key' });
  }

  const { token, baseId, table, fIdem, fStatus, statusDraft, fCartText, fCustomerText, fFinanceText, fPaid, fInvrecNum, fInvrecLink, dbxAppKey, dbxAppSecret, dbxRefreshToken, dbxBaseFolder, dbxNamespaceId } = getEnv();
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

    // Dropbox folder creation if configured and we have an orderId
    let dropbox = null;
    if (dbxAppKey && dbxAppSecret && dbxRefreshToken && orderId) {
      try {
        const accessToken = await getDropboxAccessToken({ appKey: dbxAppKey, appSecret: dbxAppSecret, refreshToken: dbxRefreshToken });
        const base = (dbxBaseFolder || '').trim();
        const normalizedBase = base ? (base.startsWith('/') ? base : `/${base}`) : '';
        // Create base folder if provided (best-effort)
        if (normalizedBase) {
          try { await dropboxCreateFolder({ accessToken, namespaceId: dbxNamespaceId, folderPath: normalizedBase }); } catch (e) {}
        }
        const subPath = `${normalizedBase}/${String(orderId)}`.replace(/\/+/, '/');
        const result = await dropboxCreateFolder({ accessToken, namespaceId: dbxNamespaceId, folderPath: subPath });
        dropbox = { path: subPath, created: !result?.conflict, existed: !!result?.conflict };
        try { console.log('[airtable/order] dropbox folder', dropbox); } catch {}

        // If uploads were provided, upload them now
        let uploadedCount = 0;
        let failed = [];
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
              const extRaw = getExtFromName(name) || getExtFromMime(mime) || 'bin';
              const filename = composeUploadFilename({ orderId, areaKey, method, product, colors, qty, ext: extRaw });
              const filePath = `${subPath}/${filename}`.replace(/\/+/, '/');
              await dropboxUploadFile({ accessToken, namespaceId: dbxNamespaceId, path: filePath, content: buffer, mode: { '.tag': 'add' }, autorename: false, mute: true });
              uploadedCount += 1;
            } catch (e) {
              try { failed.push({ name: u?.fileName || u?.name || null, error: e?.message || String(e) }); } catch {}
            }
          }
        }
        if (uploadedCount || (failed && failed.length)) {
          dropbox.uploads = { uploaded: uploadedCount, failedCount: (failed && failed.length) || 0, failed };
          try { console.log('[airtable/order] dropbox uploads', dropbox.uploads); } catch {}
        }

        // If details provided, patch Airtable with JSON blocks into 3 long-text fields
        const patchFields = {};
        try {
          if (fCustomerText && customer) {
            patchFields[fCustomerText] = JSON.stringify({
              name: customer.name || '',
              phone: customer.phone || '',
              email: customer.email || '',
              address_street: customer.address_street || customer.adress_street || '',
              address_city: customer.address_city || customer.adres_city || '',
            });
          }
          if (fFinanceText && financial) {
            const financePayload = {
              subtotal: Number(financial.subtotal || 0),
              delivery: Number(financial.delivery || 0),
              vat: Number(financial.vat || 0),
              total: Number(financial.total || 0),
              payment_method: String(financial.payment_method || financial.paymentMethod || ''),
            };
            if (financial.invrec && typeof financial.invrec === 'object') {
              if (financial.invrec.docnum != null) financePayload.invrec_num = String(financial.invrec.docnum);
              if (financial.invrec.link != null) financePayload.invrec_link = String(financial.invrec.link);
            }
            patchFields[fFinanceText] = JSON.stringify(financePayload);
            if (fPaid && (financial.paid === true || financial.paid === 'true' || financial.paid === 1)) {
              patchFields[fPaid] = true;
            }
            if (financial.invrec && typeof financial.invrec === 'object') {
              if (fInvrecNum && financial.invrec.docnum != null) patchFields[fInvrecNum] = String(financial.invrec.docnum);
              if (fInvrecLink && financial.invrec.link != null) patchFields[fInvrecLink] = String(financial.invrec.link);
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
                const ext = getExtFromName(u.fileName || '') || 'png';
                const fileName = composeUploadFilename({ orderId, areaKey, method, product, colors, qty, ext });
                const path = `${subPath}/${fileName}`.replace(/\/+/, '/');
                return { areaKey, method, product, colors, qty, fileName, path };
              });
            }
            patchFields[fCartText] = JSON.stringify(payload);
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
