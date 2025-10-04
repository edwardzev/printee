import fetch from 'node-fetch';

// Resolve environment variables with common aliases
function getEnv(name, aliases = []) {
  if (process.env[name]) return process.env[name];
  for (const a of aliases) {
    if (process.env[a]) return process.env[a];
  }
  return undefined;
}

const AIRTABLE_API_KEY = getEnv('AIRTABLE_API_KEY', ['AIRTABLE_TOKEN']);
const AIRTABLE_BASE_ID = getEnv('AIRTABLE_BASE_ID', ['AIRTABLE_BASE']);
const AIRTABLE_ORDERS_TABLE = getEnv('AIRTABLE_ORDERS_TABLE', ['AIRTABLE_TABLE', 'AIRTABLE_ORDERS_TABLE_NAME']);

function hasAirtableEnv() {
  return Boolean(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && AIRTABLE_ORDERS_TABLE);
}

function apiUrl(path) {
  const baseId = AIRTABLE_BASE_ID;
  return `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${path}`;
}

function headers() {
  return {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

function escapeFormulaString(v = '') {
  return String(v).replace(/'/g, "\\'");
}

export async function findOrderRecord({ idempotency_key, order_number }) {
  if (!hasAirtableEnv()) return null;
  const table = AIRTABLE_ORDERS_TABLE;
  const parts = [];
  if (idempotency_key) parts.push(`{IdempotencyKey}='${escapeFormulaString(idempotency_key)}'`);
  if (order_number) {
    const on = escapeFormulaString(order_number);
    // Try common variants: Order#, Order #, OrderNumber, order_number
    parts.push(`{Order#}='${on}'`);
    parts.push(`{Order #}='${on}'`);
    parts.push(`{OrderNumber}='${on}'`);
    parts.push(`{order_number}='${on}'`);
  }
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
  const table = AIRTABLE_ORDERS_TABLE;
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

function readOrderNumberFromFields(fields = {}) {
  return (
    fields['Order#'] ||
    fields['Order #'] ||
    fields.OrderNumber ||
    fields.order_number ||
    null
  );
}

export async function ensureOrderRecord(ctx) {
  if (!hasAirtableEnv()) return { order_id: null, airtable_record_id: null, order_number: null, record: null, created: false, enabled: false };
  const found = await findOrderRecord(ctx).catch(()=>null);
  if (found) {
    const recId = found.id;
    const orderNum = readOrderNumberFromFields(found.fields || {});
    return { order_id: String(recId), order_number: orderNum ? String(orderNum) : null, airtable_record_id: found.id, record: found, created: false, enabled: true };
  }
  const created = await createOrderRecord(ctx);
  let orderNum = readOrderNumberFromFields(created.fields || {});
  // If auto number hasn't materialized in the immediate response, fetch the record once
  if (!orderNum) {
    try {
      const rec = await readOrderRecord(created.id);
      orderNum = rec && rec.fields && readOrderNumberFromFields(rec.fields) || null;
    } catch (e) { /* ignore */ }
  }
  return { order_id: String(created.id), order_number: orderNum ? String(orderNum) : null, airtable_record_id: created.id, record: created, created: true, enabled: true };
}

export function airtableEnabled() { return hasAirtableEnv(); }

export async function readOrderRecord(recordId) {
  if (!hasAirtableEnv() || !recordId) return null;
  const table = AIRTABLE_ORDERS_TABLE;
  const url = apiUrl(`${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  return res.json().catch(()=>null);
}
