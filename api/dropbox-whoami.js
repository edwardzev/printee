import fetch from 'node-fetch';
import { getAccessToken } from '../src/lib/dropboxClient.js';

export default async function handler(req, res) {
  if (String(process.env.ADMIN_PROBES_ENABLED || '0') !== '1') {
    return res.status(404).json({ ok: false, error: 'Not Found' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const token = await getAccessToken();

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    // Support selecting a team member or a path root if configured
    if (process.env.DROPBOX_SELECT_USER) headers['Dropbox-API-Select-User'] = process.env.DROPBOX_SELECT_USER;
    if (process.env.DROPBOX_TEAM_MEMBER_ID && !headers['Dropbox-API-Select-User']) headers['Dropbox-API-Select-User'] = process.env.DROPBOX_TEAM_MEMBER_ID;
    if (process.env.DROPBOX_PATH_ROOT) headers['Dropbox-API-Path-Root'] = process.env.DROPBOX_PATH_ROOT;

  // Dropbox users/get_current_account expects a POST with an empty JSON object body
  const r = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { method: 'POST', headers, body: JSON.stringify({}) });
    const text = await r.text().catch(() => '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = { raw: text }; }

    if (!r.ok) {
      return res.status(200).json({ ok: false, status: r.status, response: json });
    }

    // Return the relevant root_info if present
    const root_info = (json && json.root_info) ? json.root_info : null;
    return res.status(200).json({ ok: true, account_id: json.account_id, name: json.name || null, root_info, raw: json });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message || String(err) });
  }
}
