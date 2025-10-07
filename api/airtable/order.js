// Upsert a draft order in Airtable by idempotency key (no PII at this stage)
// Env required in production:
// - AIRTABLE_TOKEN: Personal Access Token with base/table access
// - AIRTABLE_BASE_ID: Airtable Base ID (appXXXXXXXXXXXXXX)
// - AIRTABLE_TABLE_ORDERS: Table name (e.g., Orders)
// Optional envs:
// - AIRTABLE_FIELD_IDEMPOTENCY_KEY (default: IdempotencyKey)
// - AIRTABLE_FIELD_STATUS (default: Status)
// - AIRTABLE_STATUS_DRAFT (default: draft)

const API_URL = 'https://api.airtable.com/v0';

function getEnv() {
  return {
    token: process.env.AIRTABLE_TOKEN || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    table: process.env.AIRTABLE_TABLE_ORDERS || '',
    fIdem: process.env.AIRTABLE_FIELD_IDEMPOTENCY_KEY || 'IdempotencyKey',
    fStatus: process.env.AIRTABLE_FIELD_STATUS || 'Status',
    statusDraft: process.env.AIRTABLE_STATUS_DRAFT || 'draft',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const idempotency_key = String(body.idempotency_key || '').trim();
  if (!idempotency_key || idempotency_key.length < 6) {
    return res.status(400).json({ ok: false, error: 'invalid_idempotency_key' });
  }

  const { token, baseId, table, fIdem, fStatus, statusDraft } = getEnv();
  if (!token || !baseId || !table) {
    // Graceful no-op when not configured (dev/local)
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
      return res.status(resp.status).json({ ok: false, error: 'airtable_error', details: text });
    }
    const data = await resp.json();
    const rec = (data.records && data.records[0]) || null;
    return res.status(200).json({ ok: true, record: rec ? { id: rec.id, created: !!rec.created } : null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'airtable_exception', details: e?.message || String(e) });
  }
}
