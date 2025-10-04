import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const env_present = {
    AIRTABLE_API_KEY: Boolean(process.env.AIRTABLE_API_KEY),
    AIRTABLE_BASE_ID: Boolean(process.env.AIRTABLE_BASE_ID),
    AIRTABLE_ORDERS_TABLE: Boolean(process.env.AIRTABLE_ORDERS_TABLE)
  };

  if (!env_present.AIRTABLE_API_KEY || !env_present.AIRTABLE_BASE_ID || !env_present.AIRTABLE_ORDERS_TABLE) {
    return res.status(200).json({ ok: false, reason: 'missing_env', env_present });
  }

  try {
    const base = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_ORDERS_TABLE;
    const url = `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?maxRecords=1`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } });
    const text = await r.text().catch(()=> '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = { raw: text }; }
    if (!r.ok) {
      return res.status(200).json({ ok: false, reason: 'airtable_error', status: r.status, response: json, env_present });
    }
    const sample = Array.isArray(json?.records) ? json.records.slice(0,1) : null;
    return res.status(200).json({ ok: true, env_present, status: r.status, sample_count: Array.isArray(json?.records) ? json.records.length : 0, sample });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: 'exception', error: err?.message || String(err), env_present });
  }
}
