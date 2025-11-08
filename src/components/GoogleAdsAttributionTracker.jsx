import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

const trackedKeys = ['gclid', 'gbraid', 'wbraid'];

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

export default function GoogleAdsAttributionTracker() {
  const { pathname, search } = useLocation();
  const { payload, mergePayload } = useCart();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams(search || window.location.search || '');
    const incoming = {
      gclid: normalize(query.get('gclid')),
      gbraid: normalize(query.get('gbraid')),
      wbraid: normalize(query.get('wbraid')),
    };
    const hasAnyId = trackedKeys.some((key) => incoming[key]);
    if (!hasAnyId) return;

    const existingTracking = (payload && payload.tracking) || {};
    const existingGoogleAds = existingTracking.googleAds || {};
    const isNewId = trackedKeys.some((key) => {
      const nextVal = incoming[key];
      if (!nextVal) return false;
      return nextVal !== (existingGoogleAds[key] || '');
    });

    if (!isNewId && existingGoogleAds.gclid && existingGoogleAds.gbraid && existingGoogleAds.wbraid) {
      return;
    }

    const now = new Date().toISOString();
    const landing = `${pathname}${search || ''}`;
    const utm = {
      utmSource: normalize(query.get('utm_source')),
      utmMedium: normalize(query.get('utm_medium')),
      utmCampaign: normalize(query.get('utm_campaign')),
      utmTerm: normalize(query.get('utm_term')),
      utmContent: normalize(query.get('utm_content')),
    };

    const nextGoogleAds = {
      ...existingGoogleAds,
      ...Object.fromEntries(trackedKeys.map((key) => [key, incoming[key] || existingGoogleAds[key] || ''])),
      ...utm,
      landingPage: isNewId || !existingGoogleAds.landingPage ? landing : existingGoogleAds.landingPage,
      firstCaptureAt: isNewId || !existingGoogleAds.firstCaptureAt ? now : existingGoogleAds.firstCaptureAt,
      lastCaptureAt: now,
    };

    // Avoid writing if nothing changed beyond timestamps to reduce churn
    const signatureBefore = JSON.stringify({
      gclid: existingGoogleAds.gclid || '',
      gbraid: existingGoogleAds.gbraid || '',
      wbraid: existingGoogleAds.wbraid || '',
      utmSource: existingGoogleAds.utmSource || '',
      utmMedium: existingGoogleAds.utmMedium || '',
      utmCampaign: existingGoogleAds.utmCampaign || '',
      utmTerm: existingGoogleAds.utmTerm || '',
      utmContent: existingGoogleAds.utmContent || '',
    });
    const signatureAfter = JSON.stringify({
      gclid: nextGoogleAds.gclid || '',
      gbraid: nextGoogleAds.gbraid || '',
      wbraid: nextGoogleAds.wbraid || '',
      utmSource: nextGoogleAds.utmSource || '',
      utmMedium: nextGoogleAds.utmMedium || '',
      utmCampaign: nextGoogleAds.utmCampaign || '',
      utmTerm: nextGoogleAds.utmTerm || '',
      utmContent: nextGoogleAds.utmContent || '',
    });
    if (signatureBefore === signatureAfter) return;

    mergePayload({
      tracking: {
        ...existingTracking,
        googleAds: nextGoogleAds,
      },
    });
  }, [pathname, search, payload, mergePayload]);

  return null;
}
