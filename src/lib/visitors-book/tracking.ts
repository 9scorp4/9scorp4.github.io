/**
 * Analytics tracking for commands and secret discovery
 */

import { secretCommands } from './secrets';
import type { VisitorState } from './types';

/**
 * Track command usage via beacon (respects DNT)
 */
export function trackCommand(name: string, workerUrl: string): void {
  if (!workerUrl || navigator.doNotTrack === '1') return;
  const isSecret = name in secretCommands;

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
    // localStorage unavailable
  }

  try {
    navigator.sendBeacon?.(
      workerUrl + '/track',
      JSON.stringify({
        type: 'command',
        command: name,
        isSecret,
        vid,
        dev: isDev || undefined,
        devId: isDev ? devId : undefined,
      })
    );
  } catch {
    // Silently fail
  }
}

/**
 * Track secret discovery (locally, using canonical name)
 * Note: 'jardin' and 'micelio' handle their own tracking for first-time modal
 */
export function trackSecretDiscovery(
  name: string,
  state: VisitorState,
  saveState: (state: VisitorState) => void
): void {
  const canonical = secretCommands[name];
  if (!canonical) return;
  // Skip jardin and micelio — they handle their own tracking for first-time message
  if (canonical === 'jardin' || canonical === 'micelio') return;
  if (state.stats.secretsFound.includes(canonical)) return;
  state.stats.secretsFound.push(canonical);
  saveState(state);
}
