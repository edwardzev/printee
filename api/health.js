export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  return res.status(200).json({ ok: true, name: 'printeam-backend', version: process.env.VERCEL_GIT_COMMIT_SHA || 'dev', ts: new Date().toISOString() });
}
