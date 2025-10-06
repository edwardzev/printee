import { createFolder } from '../../src/lib/dropboxClient.js';

export default async function handler(req, res) {
  if (!req.method || (req.method !== 'POST' && req.method !== 'GET')) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (String(process.env.DEBUG_FORWARDER || '0') !== '1') {
    return res.status(403).json({ ok: false, error: 'disabled' });
  }

  const folder = req.method === 'GET' ? (req.query && req.query.folder) : (req.body && req.body.folder);
  if (!folder) return res.status(400).json({ ok: false, error: 'missing_folder' });

  // Use DROPBOX_BASE_FOLDER + folder
  const base = process.env.DROPBOX_BASE_FOLDER || '/printee/uploads';
  const DROPBOX_NAMESPACE_ID = process.env.DROPBOX_NAMESPACE_ID || process.env.DROPBOX_ROOT_NAMESPACE_ID || '';
  const nsPrefix = DROPBOX_NAMESPACE_ID ? `ns:${DROPBOX_NAMESPACE_ID}` : '';
  const path = `${nsPrefix}${base}/${folder}`;

  try {
    const r = await createFolder(path);
    return res.status(200).json({ ok: true, result: r });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
