import { parse } from 'url';
import { findOrderBySession, updateOrderRecord } from '../../src/lib/airtableClient.js';

// This endpoint is intended to be the success_url the user lands on after iCount payment.
// iCount may supply query params including m__session or other transaction fields.

export default async function handler(req, res) {
  // Accept GET and POST for compatibility with iCount redirects
  const method = req.method;
  let params = {};
  if (method === 'GET') {
    params = parse(req.url, true).query || {};
  } else if (method === 'POST') {
    try {
      const body = await new Promise((resolve, reject) => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ resolve(JSON.parse(d||'{}')); }catch(e){ resolve({}); } }); req.on('error', reject); });
      params = body || {};
    } catch (e) { params = {}; }
  }

  const session = params['m__session'] || params.session || params['session'] || null;
  const docnum = params.docnum || params.document || params.doc || null;
  const doclink = params.doclink || params.document_url || params.doc_url || null;

  if (session) {
    try {
      const found = await findOrderBySession(session).catch(()=>null);
      if (found && found.id) {
        const recId = found.id;
  const fields = {};
  if (docnum) fields.invrec_num = String(docnum);
  if (doclink) fields.invrec_link = String(doclink);
        if (Object.keys(fields).length) {
          await updateOrderRecord(recId, fields).catch(()=>null);
        }
      }
    } catch (e) {
      console.warn('icount-confirm-redirect: update failed', e?.message || e);
    }
  }

  // Finally redirect to generic thank-you page
  res.setHeader('Location', '/thank-you');
  res.statusCode = 302;
  res.end();
}
