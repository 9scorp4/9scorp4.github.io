/**
 * Analytics tracking for MyceliumCanvas.
 */

import type { SimNode } from './types';

/** Track node click for analytics */
export function trackNodeClick(workerUrl: string, node: SimNode): void {
  if (!workerUrl || navigator.doNotTrack === '1') return;

  // Get visitor tracking fields
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
    // localStorage may be unavailable
  }

  try {
    const label = node.type === 'track'
      ? `${node.artist} \u2014 ${node.title}`
      : node.articleTitle || node.cultivationName || node.slug || node.id;

    navigator.sendBeacon?.(
      workerUrl + '/track',
      JSON.stringify({
        type: 'node_click',
        nodeType: node.type,
        nodeLabel: label,
        vid,
        dev: isDev || undefined,
        devId: isDev ? devId : undefined,
      })
    );
  } catch {
    // Silently fail
  }
}
