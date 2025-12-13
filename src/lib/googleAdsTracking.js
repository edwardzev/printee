const isBrowser = typeof window !== 'undefined';
const isDocument = typeof document !== 'undefined';

export function extractGclidFromCookieValue(raw) {
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';
  const segments = value.split('.');
  if (segments.length >= 3) {
    const candidate = segments[segments.length - 1];
    return candidate ? candidate.trim() : '';
  }
  return value;
}

export function readGclidFromCookies() {
  if (!isDocument) return '';
  try {
    const cookieSource = document.cookie || '';
    if (!cookieSource) return '';
    const entries = cookieSource.split(';');
    for (const entry of entries) {
      const pair = entry.trim();
      if (!pair) continue;
      const [key, ...rest] = pair.split('=');
      if (!key || rest.length === 0) continue;
      const lowerKey = key.trim().toLowerCase();
      if (lowerKey === 'gclid') {
        const decoded = decodeURIComponent(rest.join('='));
        const candidate = decoded.trim();
        if (candidate) return candidate;
      }
      if (lowerKey === '_gcl_aw' || lowerKey === '_gcl_dc') {
        const decoded = decodeURIComponent(rest.join('='));
        const candidate = extractGclidFromCookieValue(decoded);
        if (candidate) return candidate;
      }
    }
  } catch (e) {
    try {
      console.warn('[Tracking] Failed to parse cookies for gclid', e?.message || String(e));
    } catch (_) {}
  }
  return '';
}

function safeReadJson(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {}
  return null;
}

function legacyRead(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return '';
  try {
    return storage.getItem(key) || '';
  } catch (_) {
    return '';
  }
}

export function readStoredGoogleAds() {
  if (!isBrowser) return {};
  let data = null;
  try { data = safeReadJson(window.sessionStorage, 'printee:last-googleads'); } catch (_) {}
  if (!data) {
    try { data = safeReadJson(window.localStorage, 'printee:last-googleads'); } catch (_) {}
  }
  if (data) {
    if (!data.conversionTime) {
      let storedConversion = legacyRead(window.sessionStorage, 'printee:last-conversion-time');
      if (!storedConversion) storedConversion = legacyRead(window.localStorage, 'printee:last-conversion-time');
      if (storedConversion) data.conversionTime = storedConversion;
    }
    return data;
  }

  const fallback = {};
  let stored = legacyRead(window.sessionStorage, 'printee:last-gclid');
  if (!stored) stored = legacyRead(window.localStorage, 'printee:last-gclid');
  if (stored && typeof stored === 'string') fallback.gclid = stored.trim();
  let storedConversion = legacyRead(window.sessionStorage, 'printee:last-conversion-time');
  if (!storedConversion) storedConversion = legacyRead(window.localStorage, 'printee:last-conversion-time');
  if (storedConversion) fallback.conversionTime = storedConversion.trim();
  return fallback;
}

export function writeStoredGoogleAds(data, extras = {}) {
  if (!isBrowser || !data || typeof data !== 'object') return;
  const payload = {
    gclid: (data.gclid || '').trim(),
    gbraid: (data.gbraid || '').trim(),
    wbraid: (data.wbraid || '').trim(),
    campaign: (data.campaign || '').trim(),
    keyword: (data.keyword || '').trim(),
    utmSource: (data.utmSource || '').trim(),
    utmMedium: (data.utmMedium || '').trim(),
    captureSource: (data.source || '').trim(),
    lastCapturedAt: (data.lastCapturedAt || '').trim(),
    conversionTime: (extras.conversionTime || data.conversionTime || '').trim(),
  };
  const serialized = JSON.stringify(payload);
  try { window.sessionStorage?.setItem('printee:last-googleads', serialized); } catch (_) {}
  try { window.localStorage?.setItem('printee:last-googleads', serialized); } catch (_) {}

  if (payload.conversionTime) {
    try { window.sessionStorage?.setItem('printee:last-conversion-time', payload.conversionTime); } catch (_) {}
    try { window.localStorage?.setItem('printee:last-conversion-time', payload.conversionTime); } catch (_) {}
  }
  if (payload.gclid) {
    try { window.sessionStorage?.setItem('printee:last-gclid', payload.gclid); } catch (_) {}
    try { window.localStorage?.setItem('printee:last-gclid', payload.gclid); } catch (_) {}
  }
}

export function detectDeviceCategory() {
  if (typeof navigator === 'undefined') return '';
  try {
    const nav = navigator;
    if (nav.userAgentData && typeof nav.userAgentData === 'object') {
      if (nav.userAgentData.mobile) return 'mobile';
      const platform = String(nav.userAgentData.platform || '').toLowerCase();
      if (platform.includes('android')) return 'tablet';
    }
    const ua = String(nav.userAgent || '');
    const isTablet = /ipad|tablet|nexus 7|nexus 9|nexus 10|xoom|silk|sm-t|kfapwi|kindle/i.test(ua)
      || (/android/i.test(ua) && !/mobile/i.test(ua));
    if (isTablet) return 'tablet';
    const isMobile = /mobi|iphone|ipod|android.+mobile|blackberry|iemobile|opera mini/i.test(ua);
    if (isMobile) return 'mobile';
    return 'desktop';
  } catch (_) {
    return '';
  }
}

export function getGoogleAdsSnapshot(payloadGoogleAds = {}) {
  const stored = readStoredGoogleAds();
  const cookieGclid = readGclidFromCookies();
  const snapshot = { ...(stored || {}), ...(payloadGoogleAds || {}) };
  if (!snapshot.gclid && cookieGclid) snapshot.gclid = cookieGclid;
  if (!snapshot.source && snapshot.gclid) snapshot.source = snapshot.captureSource || 'storage';
  return snapshot;
}

export function getTrackingMetadataSnapshot(payloadMetadata = {}) {
  const stored = readStoredGoogleAds();
  const snapshot = { ...(payloadMetadata || {}) };
  if (!snapshot.conversionTime && stored?.conversionTime) {
    snapshot.conversionTime = stored.conversionTime;
  }
  if (!snapshot.device) snapshot.device = detectDeviceCategory();
  return snapshot;
}
