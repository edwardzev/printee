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
    return res.status(200).json({ ok: true, token_obfuscated: ob, message: 'Token refresh succeeded' });
  } catch (err) {
    // Provide the error message and, if present, the underlying text for debugging.
    const msg = err && (err.message || String(err)) || 'unknown error';
    return res.status(500).json({ ok: false, error: msg });
  }
}
