import fetch from 'node-fetch';

function hasAirtableEnv() {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_ORDERS_TABLE);
}

function apiUrl(path) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  return `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${path}`;
}

function headers() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

function escapeFormulaString(v = '') {
  return String(v).replace(/'/g, "\\'");
}

export async function findOrderRecord({ idempotency_key, order_number }) {
  if (!hasAirtableEnv()) return null;
  const table = process.env.AIRTABLE_ORDERS_TABLE;
  const parts = [];
  if (idempotency_key) parts.push(`{IdempotencyKey}='${escapeFormulaString(idempotency_key)}'`);
  if (order_number) parts.push(`{OrderNumber}='${escapeFormulaString(order_number)}'`);
  if (!parts.length) return null;
  const formula = parts.length === 1 ? parts[0] : `OR(${parts.join(',')})`;
  const url = apiUrl(`${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const json = await res.json().catch(()=>null);
  if (!json || !Array.isArray(json.records) || !json.records.length) return null;
  return json.records[0];
}

export async function createOrderRecord({ idempotency_key }) {
  if (!hasAirtableEnv()) return null;
  const table = process.env.AIRTABLE_ORDERS_TABLE;
  // Minimal create: let Airtable generate the primary field (Order#)
  const fields = {};
  if (idempotency_key) fields.IdempotencyKey = idempotency_key;
  const body = { records: [ { fields } ] };
  const url = apiUrl(encodeURIComponent(table));
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const json = await res.json().catch(()=>null);
  if (!res.ok || !json || !Array.isArray(json.records) || !json.records.length) {
    const msg = json && (json.error?.message || JSON.stringify(json).slice(0,200)) || `status:${res.status}`;
    throw new Error('Airtable create failed: ' + msg);
  }
  const rec = json.records[0];
  return rec;
}

export async function ensureOrderRecord(ctx) {
  if (!hasAirtableEnv()) return { order_id: null, airtable_record_id: null, record: null, created: false };
  const found = await findOrderRecord(ctx).catch(()=>null);
  if (found) {
    const recId = found.id;
    const orderNum = (found.fields && (found.fields['Order#'] || found.fields.OrderNumber || found.fields.order_number)) || null;
    return { order_id: String(recId), order_number: orderNum ? String(orderNum) : null, airtable_record_id: found.id, record: found, created: false };
  }
  const created = await createOrderRecord(ctx);
  let orderNum = (created.fields && (created.fields['Order#'] || created.fields.OrderNumber || created.fields.order_number)) || null;
  // If auto number hasn't materialized in the immediate response, fetch the record once
  if (!orderNum) {
    try {
      const rec = await readOrderRecord(created.id);
      orderNum = rec && rec.fields && (rec.fields['Order#'] || rec.fields.OrderNumber || rec.fields.order_number) || null;
    } catch (e) { /* ignore */ }
  }
  return { order_id: String(created.id), order_number: orderNum ? String(orderNum) : null, airtable_record_id: created.id, record: created, created: true };
}

export function airtableEnabled() { return hasAirtableEnv(); }

export async function readOrderRecord(recordId) {
  if (!hasAirtableEnv() || !recordId) return null;
  const table = process.env.AIRTABLE_ORDERS_TABLE;
  const url = apiUrl(`${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  return res.json().catch(()=>null);
}
