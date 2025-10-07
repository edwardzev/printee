export default async function handler(req, res) {
  const method = req.method || 'GET';
  const now = new Date().toISOString();
  const info = {
    ok: true,
    method,
    ts: now,
    query: req.query || {},
  };
  if (method === 'GET') {
    return res.status(200).json({ ...info, echo: 'hello' });
  }
  if (method === 'POST') {
    const body = req.body;
    return res.status(200).json({ ...info, body });
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
