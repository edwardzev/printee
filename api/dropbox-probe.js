import { getAccessToken } from '../src/lib/dropboxClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  // Warning: this endpoint is a diagnostics helper. It will attempt a live token refresh
  // using the environment variables available to the running process. It returns an
  // obfuscated token on success and a detailed error message on failure to help debug
  // issues such as client_id/secret mismatches or invalid refresh tokens.

  try {
    const token = await getAccessToken();
    const ob = typeof token === 'string' && token.length > 8
      ? `${token.slice(0,4)}...${token.slice(-4)}`
      : (token || null);
    const presence = {
      DROPBOX_APP_KEY: Boolean(process.env.DROPBOX_APP_KEY),
      DROPBOX_APP_SECRET: Boolean(process.env.DROPBOX_APP_SECRET),
      DROPBOX_REFRESH_TOKEN: Boolean(process.env.DROPBOX_REFRESH_TOKEN),
      DROPBOX_TOKEN: Boolean(process.env.DROPBOX_TOKEN)
    };
    return res.status(200).json({ ok: true, token_obfuscated: ob, message: 'Token refresh succeeded', env_present: presence });
  } catch (err) {
    // Provide the error message and, if present, the underlying text for debugging.
    const msg = err && (err.message || String(err)) || 'unknown error';
    const presence = {
      DROPBOX_APP_KEY: Boolean(process.env.DROPBOX_APP_KEY),
      DROPBOX_APP_SECRET: Boolean(process.env.DROPBOX_APP_SECRET),
      DROPBOX_REFRESH_TOKEN: Boolean(process.env.DROPBOX_REFRESH_TOKEN),
      DROPBOX_TOKEN: Boolean(process.env.DROPBOX_TOKEN)
    };
    return res.status(500).json({ ok: false, error: msg, env_present: presence });
  }
}
