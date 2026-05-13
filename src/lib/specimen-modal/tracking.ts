/**
 * Analytics tracking for specimen modal interactions
 */

declare global {
  interface Window {
    __specimenWorkerUrl?: string;
  }
}

interface TrackingPayload {
  type: 'specimen_open';
  specimenName: string;
  series?: string;
  vid?: string;
  dev?: boolean;
  devId?: string;
}

/**
 * Track when a specimen modal is opened
 */
export function trackSpecimenOpen(specimen: { name: string; series?: string }): void {
  const workerUrl = window.__specimenWorkerUrl;
  if (!workerUrl || navigator.doNotTrack === '1') return;

  // Get visitor tracking fields from localStorage
  let vid: string | undefined;
  let isDev = false;
  let devId: string | undefined;

  try {
    vid = localStorage.getItem('jardin-vid') || undefined;
    isDev = localStorage.getItem('jardin-dev') === '1';
    if (isDev) {
      devId = localStorage.getItem('jardin-dev-id') || 'unnamed';
    }
  } catch {
    // localStorage unavailable
  }

  const payload: TrackingPayload = {
    type: 'specimen_open',
    specimenName: specimen.name,
    series: specimen.series,
    vid,
    dev: isDev || undefined,
    devId: isDev ? devId : undefined,
  };

  try {
    navigator.sendBeacon?.(
      workerUrl + '/track',
      JSON.stringify(payload)
    );
  } catch {
    // Silently fail - analytics should never break UX
  }
}
