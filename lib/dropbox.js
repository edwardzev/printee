import { logError } from "./logger.js";

const DROPBOX_OAUTH_URL = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_API_URL = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_API_URL = 'https://content.dropboxapi.com/2';

/**
 * Get Dropbox access token using refresh token
 * 
 * @param {Object} params - OAuth parameters
 * @param {string} params.appKey - Dropbox app key
 * @param {string} params.appSecret - Dropbox app secret
 * @param {string} params.refreshToken - Dropbox refresh token
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<string>} Access token
 */
export async function getDropboxAccessToken({ appKey, appSecret, refreshToken }, context = {}) {
  try {
    const basic = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const resp = await fetch(DROPBOX_OAUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Dropbox token ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    return data.access_token;
  } catch (err) {
    logError(err, { ...context, endpoint: "Dropbox.getAccessToken" });
    throw err;
  }
}

/**
 * Upload a file to Dropbox
 * 
 * @param {string} path - Dropbox file path
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<Object>} Upload result
 */
export async function uploadToDropbox(path, fileBuffer, context = {}) {
  try {
    const response = await fetch(`${DROPBOX_CONTENT_API_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DROPBOX_TOKEN || process.env.DROPBOX_ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite" }),
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Dropbox upload ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (err) {
    logError(err, { ...context, endpoint: "Dropbox.upload", dropboxPath: path });
    throw err;
  }
}

/**
 * Create a folder in Dropbox
 * 
 * @param {Object} params - Folder creation parameters
 * @param {string} params.accessToken - Dropbox access token
 * @param {string} [params.namespaceId] - Dropbox namespace ID
 * @param {string} params.folderPath - Path for the new folder
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<Object>} Creation result
 */
export async function createDropboxFolder({ accessToken, namespaceId, folderPath }, context = {}) {
  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    if (namespaceId) {
      headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
    }
    const url = `${DROPBOX_API_URL}/files/create_folder_v2`;
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ path: folderPath, autorename: false }),
    });
    if (resp.ok) return resp.json();
    const errText = await resp.text().catch(() => '');
    // Treat conflict (already exists) as success
    if (resp.status === 409 && /conflict/i.test(errText)) {
      return { ok: true, conflict: true };
    }
    throw new Error(`Dropbox create folder ${resp.status}: ${errText}`);
  } catch (err) {
    logError(err, { ...context, endpoint: "Dropbox.createFolder", dropboxPath: folderPath });
    throw err;
  }
}

/**
 * Create a shared link for a Dropbox path
 * 
 * @param {Object} params - Shared link parameters
 * @param {string} params.accessToken - Dropbox access token
 * @param {string} [params.namespaceId] - Dropbox namespace ID
 * @param {string} params.path - Dropbox path
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<string|null>} Shared link URL
 */
export async function createDropboxSharedLink({ accessToken, namespaceId, path }, context = {}) {
  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    if (namespaceId) {
      headers['Dropbox-API-Path-Root'] = JSON.stringify({ '.tag': 'namespace_id', namespace_id: namespaceId });
    }
    const url = `${DROPBOX_API_URL}/sharing/create_shared_link_with_settings`;
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ path }) });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      return data && data.url ? data.url : null;
    }
    // Try to parse error body; Dropbox may return 409 when a shared link already exists
    const errText = await resp.text().catch(() => '');
    try {
      const errJson = JSON.parse(errText || '{}');
      const existing = errJson?.error?.shared_link_already_exists?.metadata?.url || errJson?.shared_link_already_exists?.metadata?.url;
      if (existing) {
        return existing;
      }
    } catch (e) {
      // fallthrough to throw below
    }
    throw new Error(`Dropbox create shared link ${resp.status}: ${errText}`);
  } catch (err) {
    logError(err, { ...context, endpoint: "Dropbox.createSharedLink", dropboxPath: path });
    throw err;
  }
}
