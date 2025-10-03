import fetch from 'node-fetch';

let cached = { token: null, expiresAt: 0 };

async function getAccessToken() {
  // If a legacy DROPBOX_TOKEN is provided, use it (dev convenience)
  if (process.env.DROPBOX_TOKEN) return process.env.DROPBOX_TOKEN;

  const now = Date.now();
  if (cached.token && cached.expiresAt && cached.expiresAt > now + 10000) {
    return cached.token;
  }

  const key = process.env.DROPBOX_APP_KEY;
  const secret = process.env.DROPBOX_APP_SECRET;
  const refresh = process.env.DROPBOX_REFRESH_TOKEN;
  if (!key || !secret || !refresh) throw new Error('Dropbox OAuth not configured (DROPBOX_APP_KEY/SECRET/REFRESH_TOKEN)');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: key,
    client_secret: secret
  });

  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error('Failed to refresh Dropbox access token: ' + (json.error_description || json.error || res.status));
  }

  const expiresIn = Number(json.expires_in) || 14400;
  cached.token = json.access_token;
  cached.expiresAt = Date.now() + (expiresIn * 1000);
  return cached.token;
}

async function uploadBuffer(buffer, dropboxPath) {
  const token = await getAccessToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false }),
      'Content-Type': 'application/octet-stream'
    },
    body: buffer
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const txt = json && json.error_summary ? json.error_summary : `status:${res.status}`;
    throw new Error('Dropbox upload failed: ' + txt);
  }
  return json;
}

async function createSharedLink(dropboxPath) {
  const token = await getAccessToken();
  // try to create
  try {
    const res = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dropboxPath })
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json && json.url) return json.url.replace('?dl=0', '?raw=1');
  } catch (e) {}

  // fallback to list_shared_links
  try {
    const res2 = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dropboxPath, direct_only: true })
    });
    const json2 = await res2.json().catch(() => null);
    if (json2 && Array.isArray(json2.links) && json2.links.length) return json2.links[0].url.replace('?dl=0', '?raw=1');
  } catch (e) {}

  return null;
}

export { getAccessToken, uploadBuffer, createSharedLink };
