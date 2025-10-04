import { ensureOrderRecord, airtableEnabled } from '../src/lib/airtableClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const enabled = airtableEnabled();
  if (!enabled) {
    return res.status(200).json({ ok: false, reason: 'airtable_disabled_or_missing_env' });
  }

  const confirm = String(req.query?.confirm || '').toLowerCase();
  const idKey = `probe-${Date.now()}`;
  try {
    if (confirm === '1' || confirm === 'true' || confirm === 'yes') {
      const ensured = await ensureOrderRecord({ idempotency_key: idKey });
      return res.status(200).json({ ok: true, ensured });
    }
    return res.status(200).json({ ok: true, dryRun: true, hint: 'Pass ?confirm=1 to create a probe record with idempotency_key', idempotency_key: idKey });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message || String(err) });
  }
}
