/**
 * garden-console/tracking.ts
 * Privacy-respecting pageview and outbound link tracking
 */

import { DEV_KEY, DEV_ID_KEY } from './auth';

export interface TrackingState {
  vid: string | null;
  isDev: boolean;
  devId: string | null;
}

/**
 * Get current tracking state from localStorage
 */
export function getTrackingState(): TrackingState {
  let vid: string | null = null;
  let isDev = false;
  let devId: string | null = null;

  try {
    vid = localStorage.getItem('jardin-vid');
    if (!vid) {
      // Use crypto.randomUUID if available, otherwise fallback
      vid = crypto.randomUUID?.() ??
        (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 36);
      localStorage.setItem('jardin-vid', vid);
    }
    isDev = localStorage.getItem(DEV_KEY) === '1';
    if (isDev) {
      devId = localStorage.getItem(DEV_ID_KEY) || 'unnamed';
    }
  } catch {
    // localStorage unavailable
  }

  return { vid, isDev, devId };
}

/**
 * Send pageview beacon with enhanced metadata
 */
export function trackPageview(workerUrl: string): void {
  if (!workerUrl || navigator.doNotTrack === '1') return;

  const { vid, isDev, devId } = getTrackingState();

  try {
    // Detect device type from viewport width
    const vw = window.innerWidth;
    let deviceType = 'desktop';
    if (vw < 768) deviceType = 'mobile';
    else if (vw < 1024) deviceType = 'tablet';

    navigator.sendBeacon?.(
      workerUrl + '/track',
      JSON.stringify({
        type: 'pageview',
        path: location.pathname,
        referrer: document.referrer || undefined,
        deviceType,
        viewportWidth: vw,
        hourLocal: new Date().getHours(),
        vid: vid || undefined,
        dev: isDev || undefined,
        devId: isDev ? devId : undefined,
      })
    );
  } catch {
    // Silently fail if tracking fails
  }
}

/**
 * Set up delegated click handler for outbound link tracking
 */
export function setupOutboundTracking(workerUrl: string): void {
  if (!workerUrl || navigator.doNotTrack === '1') return;

  const { vid, isDev, devId } = getTrackingState();

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="http"]') as HTMLAnchorElement | null;
    if (!link) return;

    try {
      const url = new URL(link.href);
      // Skip same-origin links
      if (url.origin === location.origin) return;

      navigator.sendBeacon?.(
        workerUrl + '/track',
        JSON.stringify({
          type: 'outbound_click',
          domain: url.hostname,
          context: location.pathname,
          vid: vid || undefined,
          dev: isDev || undefined,
          devId: isDev ? devId : undefined,
        })
      );
    } catch {
      // Invalid URL or tracking failed
    }
  });
}
