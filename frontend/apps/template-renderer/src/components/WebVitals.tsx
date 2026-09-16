/**
 * Web Vitals RUM reporter — STEP 13 (Real User Monitoring).
 *
 * Collects Core Web Vitals (LCP, INP/ FID, CLS, TTFB, FCP) via
 * `next/web-vitals` and posts them to the SAME-ORIGIN `/api/perf` ingress,
 * which forwards to the backend analytics plane when configured.
 *
 * GDPR (Art. 6/7): metrics are sent ONLY after the visitor grants the
 * `analytics` consent category (cookie banner, `jol-cookie-consent`). The
 * payload carries NO personal data — metric name/value, rating, metric id
 * and the page path. Consent is re-checked per metric batch, so enabling
 * analytics mid-session starts reporting without a reload.
 *
 * PERFORMANCE: this component is ~1KB of client JS; the web-vitals
 * observers are passive and idle until metric finalization (page hide).
 */
'use client';

import { useReportWebVitals } from 'next/web-vitals';

/** Consent storage contract shared with the ui CookieConsentBanner. */
const CONSENT_STORAGE_KEY = 'jol-cookie-consent';

function analyticsConsented(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false; // Corrupt consent state → treat as no consent.
  }
}

export function WebVitals(): null {
  useReportWebVitals((metric) => {
    if (!analyticsConsented()) return;

    const payload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: 'rating' in metric ? metric.rating : undefined,
      route: window.location.pathname,
    };

    // Fire-and-forget: metrics must never block or break the page.
    void fetch('/api/perf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // survive page unload (metric finalization)
    }).catch(() => undefined);
  });

  return null;
}
