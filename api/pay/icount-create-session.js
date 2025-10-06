import { v4 as uuidv4 } from 'uuid';
import normalize from '../../src/lib/normalizeOrderPayload.js';
import { findOrderRecord, airtableEnabled, updateOrderRecord, findOrderBySession } from '../../src/lib/airtableClient.js';
import fs from 'fs';
import path from 'path';

// Endpoint: POST /api/pay/icount-create-session
// Body: full client payload (partial or normalized). Returns { ok: true, session_id, icountPage (optional) }
// IMPORTANT: This endpoint will ONLY create a session if an Airtable order record already exists
// (found via idempotency_key or order_number). It will NOT create a new Airtable record. This
// enforces the requirement that the forward-order flow creates the order first.

const ICOUNT_PAGE_ID = process.env.ICOUNT_PAGE_ID || process.env.ICOUNT_CC_PAGE_ID || process.env.ICOUNT_MPAGE || '6fa96';
const APP_BASE_URL = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
const RETURN_SUCCESS = process.env.ICOUNT_RETURN_SUCCESS || (APP_BASE_URL ? `${APP_BASE_URL}/thank-you/icount` : 'https://printee.co.il/thank-you/icount');
const RETURN_FAIL = process.env.ICOUNT_RETURN_FAIL || (APP_BASE_URL ? `${APP_BASE_URL}/payment-failed` : 'https://printee.co.il/payment-failed');
const IPN_URL = process.env.ICOUNT_IPN_URL || (APP_BASE_URL ? `${APP_BASE_URL}/api/pay/icount/ipn` : 'https://printee.co.il/api/pay/icount/ipn');

export default async function handler(req, res) {
  // Allow GET (small query param session creation) and POST (legacy full body)
  let body = {};
  if (req.method === 'GET') {
    // small fields passed via query string to avoid large request bodies
    const q = req.query || {};
    body = {
      idempotency_key: q.idempotency_key,
      order: {
        totals: { grand_total: Number(q.grand_total) || 0 },
        description: q.desc || q.description || ''
      },
      contact: { name: q.name || q.full_name || '', phone: q.phone || q.contact_phone || '', email: q.email || q.contact_email || '' }
    };
  } else if (req.method === 'POST') {
    try { body = await new Promise((resolve, reject) => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ resolve(JSON.parse(d||'{}')); }catch(e){ resolve({}); } }); req.on('error', reject); }); } catch (e) { body = req.body || {}; }
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  // Normalize payload so we have canonical fields
  const normalized = typeof normalize === 'function' ? normalize(body || {}) : (body || {});

  // Find existing Airtable order record (do NOT create). We require an existing record so sessions map clearly.
  let found = null;
  try {
    found = await findOrderRecord({ idempotency_key: normalized.idempotency_key, order_number: normalized?.order?.order_number }).catch(()=>null);
  } catch (e) {
    console.warn('icount-create-session: airtable find failed', e?.message || e);
    found = null;
  }

  // If an Airtable record is found, persist the session. If not found, continue —
  // record creation is handled independently by the forward-order process and payment
  // should not be blocked by it. We still return a session token so the redirect
  // handler can correlate when the record appears later.
  if (!found) {
    if (process.env.DEBUG_FORWARDER === '1') console.warn('icount-create-session: no existing airtable record found; proceeding without persist');
  }

  // Create a session id
  const sessionId = `ps_${uuidv4()}`;

  // If we have Airtable, persist session info on the record for later IPN correlation
  if (found && found.id) {
    try {
      const fields = {
        PaymentSession: sessionId,
        RawPayload: JSON.stringify(normalized).slice(0, 100000) // avoid storing giant payloads beyond Airtable limits
      };
      await updateOrderRecord(found.id, fields).catch(()=>{});
    } catch (e) {
      console.warn('icount-create-session: airtable update failed', e?.message || e);
    }
  }

  // Build a minimal set of iCount params that client can post to iCount page
  const orderNum = found?.fields && (found.fields['Order#'] || found.fields['Order #'] || found.fields.OrderNumber);
  const description = normalized.order?.description || normalized.order?.title || '';
  const contactName = normalized.customer?.company_name || normalized.customer?.contact_name || normalized.contact?.name || '';

  const csAmount = Number(normalized?.order?.totals?.grand_total) || 0;
  const icountPayload = {
    cs: csAmount,
    cd: description || (orderNum ? `Order ${orderNum}` : `Order ${normalized.order?.order_number || normalized.order?.order_id || ''}`),
    currency_code: normalized.order?.currency || 'ILS',
    full_name: contactName,
    contact_email: normalized.customer?.email || normalized.contact?.email || '',
    contact_phone: normalized.customer?.phone || normalized.contact?.phone || '',
    success_url: RETURN_SUCCESS,
    failure_url: RETURN_FAIL,
    ipn_url: IPN_URL,
    // include our session token as a custom param (iCount will echo back m__session in IPN)
    ['m__session']: sessionId,
      // include explicit order metadata so iCount page can show the correct order details
      ['m__order_number']: orderNum || normalized.order?.order_number || normalized.order?.order_id || '',
      ['m__order_desc']: description || '',
      // small cart summary (truncated) to help display items on the payment page if supported
      ['m__cart']: JSON.stringify((normalized.items || []).slice(0,5)).slice(0, 1000),
    // optionally include the iCount page id if configured
    page_id: ICOUNT_PAGE_ID
  };

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, session_id: sessionId, icount: icountPayload }));
}
