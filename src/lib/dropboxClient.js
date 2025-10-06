import fetch from 'node-fetch';

let cached = { token: null, expiresAt: 0 };

// Optional namespace id (from get_current_account root_info.root_namespace_id)
const DROPBOX_NAMESPACE_ID = process.env.DROPBOX_NAMESPACE_ID || process.env.DROPBOX_ROOT_NAMESPACE_ID || '';
// If true, do NOT send Dropbox-API-Path-Root header; rely on ns:<id> prefix in paths instead.
// Default to true to match forward-order's ns: prefix strategy and avoid conflicting targeting.
const DROPBOX_PATH_ROOT_DISABLED = String(process.env.DROPBOX_PATH_ROOT_DISABLED || '1') === '1';

function accountHeaders(base = {}) {
  const h = { ...base };
  if (DROPBOX_NAMESPACE_ID && !DROPBOX_PATH_ROOT_DISABLED) {
    try {
      // Dropbox expects a JSON string for the path-root header
      h['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'root', root_namespace_id: String(DROPBOX_NAMESPACE_ID) });
    } catch (e) {
      // ignore
    }
  }
  return h;
}

async function getAccessToken() {
  // If a legacy DROPBOX_TOKEN is provided, use it (dev convenience)
  if (process.env.DROPBOX_TOKEN) return process.env.DROPBOX_TOKEN;

  const now = Date.now();
  if (cached.token && cached.expiresAt && cached.expiresAt > now + 10000) {
    return cached.token;
  }

  // Support several env var names to accommodate different setups
  const key = process.env.DROPBOX_APP_KEY
    || process.env.DROPBOX_KEY
    || process.env.DBX_APP_KEY
    || process.env.DBX_CLIENT_ID
    || process.env.DROPBOX_CLIENT_ID;

  const secret = process.env.DROPBOX_APP_SECRET
    || process.env.DROPBOX_SECRET
    || process.env.DBX_APP_SECRET
    || process.env.DBX_CLIENT_SECRET
    || process.env.DROPBOX_CLIENT_SECRET;

  const refresh = process.env.DROPBOX_REFRESH_TOKEN
    || process.env.DBX_REFRESH_TOKEN
    || process.env.DROPBOX_TOKEN_REFRESH;
  if (!key || !secret || !refresh) {
    // Include presence booleans in the error for easier debugging
    const presence = {
      DROPBOX_APP_KEY: Boolean(key),
      DROPBOX_APP_SECRET: Boolean(secret),
      DROPBOX_REFRESH_TOKEN: Boolean(refresh)
    };
    throw new Error('Dropbox OAuth not configured (DROPBOX_APP_KEY/SECRET/REFRESH_TOKEN) ' + JSON.stringify(presence));
  }

  const url = 'https://api.dropbox.com/oauth2/token';

  // Two strategies:
  // 1) Basic auth header + grant_type=refresh_token&refresh_token=...
  // 2) client_id/client_secret in the body (no Authorization header)
  const attempts = [
    {
      mode: 'basic',
      headers: () => ({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`
      }),
      body: () => new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }).toString()
    },
    {
      mode: 'body-credentials',
      headers: () => ({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      body: () => new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh,
        client_id: key,
        client_secret: secret
      }).toString()
    }
  ];

  let lastErr = null;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    for (let j = 0; j < 2; j++) { // retry once per strategy
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: attempt.headers(),
          body: attempt.body()
        });
        const text = await res.text().catch(() => '');
        let json = {};
        try { json = text ? JSON.parse(text) : {}; } catch {
          json = { raw: text };
        }

        if (!res.ok || !json.access_token) {
          const msg = `mode=${attempt.mode} status=${res.status} error=${json.error || ''} desc=${json.error_description || ''} raw=${json.raw ? String(json.raw).slice(0,200) : ''}`;
          lastErr = new Error('Failed to refresh Dropbox access token: ' + msg);
          if (j === 0) await new Promise(r => setTimeout(r, 250));
          continue;
        }

        const expiresIn = Number(json.expires_in) || 14400;
        cached.token = json.access_token;
        cached.expiresAt = Date.now() + (expiresIn * 1000);
        return cached.token;
      } catch (e) {
        lastErr = e;
        if (j === 0) await new Promise(r => setTimeout(r, 250));
      }
    }
  }

  throw new Error('Dropbox token refresh failed: ' + (lastErr && (lastErr.message || String(lastErr)) || 'unknown'));
}

async function uploadBuffer(buffer, dropboxPath) {
  const token = await getAccessToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: accountHeaders({
      'Authorization': `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false }),
      'Content-Type': 'application/octet-stream'
    }),
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
      headers: accountHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }),
      body: JSON.stringify({ path: dropboxPath })
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json && json.url) return json.url.replace('?dl=0', '?raw=1');
  } catch (e) {}

  // fallback to list_shared_links
  try {
    const res2 = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: accountHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }),
      body: JSON.stringify({ path: dropboxPath, direct_only: true })
    });
    const json2 = await res2.json().catch(() => null);
    if (json2 && Array.isArray(json2.links) && json2.links.length) return json2.links[0].url.replace('?dl=0', '?raw=1');
  } catch (e) {}

  return null;
}

async function createFolder(dropboxPath) {
  const token = await getAccessToken();
  const res = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
    method: 'POST',
    headers: accountHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }),
    body: JSON.stringify({ path: dropboxPath, autorename: false })
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const txt = json && json.error_summary ? json.error_summary : `status:${res.status}`;
    throw new Error('Dropbox create folder failed: ' + txt);
  }
  return json;
}

export { getAccessToken, uploadBuffer, createSharedLink, createFolder };
