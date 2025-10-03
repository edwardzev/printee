export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const keys = [
    'DROPBOX_APP_KEY',
    'DROPBOX_APP_SECRET',
    'DROPBOX_REFRESH_TOKEN',
    'DROPBOX_TOKEN',
    'DROPBOX_FOLDER',
    'PABBLY_URL'
  ];

  const presence = Object.fromEntries(
    keys.map(k => [k, Boolean(process.env[k])])
  );

  return res.status(200).json({ ok: true, env_present: presence });
}
