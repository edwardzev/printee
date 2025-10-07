import { getOrder } from './store.js';

export default async function handler(req, res) {
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ ok: false, error: 'missing id' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  const rec = getOrder(id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  return res.status(200).json({ ok: true, order: rec });
}
