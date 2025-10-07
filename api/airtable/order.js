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

function getEnv() {
  return {
    token: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    table: process.env.AIRTABLE_ORDERS_TABLE || process.env.AIRTABLE_TABLE_ORDERS || '',
  fIdem: process.env.AIRTABLE_FIELD_IDEMPOTENCY_KEY || 'IdempotencyKey',
    fStatus: process.env.AIRTABLE_FIELD_STATUS || 'Status',
    statusDraft: process.env.AIRTABLE_STATUS_DRAFT || 'draft',
  };
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
  if (!idempotency_key || idempotency_key.length < 6) {
    return res.status(400).json({ ok: false, error: 'invalid_idempotency_key' });
  }

  const { token, baseId, table, fIdem, fStatus, statusDraft } = getEnv();
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
            fields: {
              [fIdem]: idempotency_key,
              [fStatus]: statusDraft,
            },
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
    return res.status(200).json({ ok: true, record: rec ? { id: rec.id, created: !!rec.created } : null });
  } catch (e) {
    try { console.error('[airtable/order] exception', e?.message || String(e)); } catch {}
    return res.status(500).json({ ok: false, error: 'airtable_exception', details: e?.message || String(e) });
  }
}
