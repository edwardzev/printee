import { createOrder, listOrders } from './store.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const limit = parseInt(String(req.query?.limit || '20'), 10) || 20;
    const items = listOrders(limit);
    return res.status(200).json({ ok: true, items, count: items.length });
  }
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      // minimal shape: cart[], contact{}, paymentMethod?, totals?
      const rec = createOrder({
        cart: Array.isArray(body.cart) ? body.cart : [],
        contact: body.contact || {},
        paymentMethod: body.paymentMethod || '',
        totals: body.totals || body.cartSummary || {},
      });
      return res.status(201).json({ ok: true, order: rec });
    } catch (e) {
      return res.status(400).json({ ok: false, error: e?.message || String(e) });
    }
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
