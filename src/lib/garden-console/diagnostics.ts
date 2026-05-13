/**
 * garden-console/diagnostics.ts
 * window.garden API orchestrator
 *
 * Modules:
 * - surfaces.ts: surface definitions and utilities
 * - reflection.ts: reflect() and ecology()
 * - xray-mode.ts: xray() and explore() visualization
 */

import { getPageContext, getSurfaces, styles } from './surfaces';
import { reflect, ecology } from './reflection';
import { createXrayState, createExploreState, createXrayMode, createExploreMode } from './xray-mode';
import { tend as authTend, untend as authUntend, amnesty as authAmnesty } from './auth';

// Re-export for external consumers
export { getPageContext } from './surfaces';

/**
 * Initialize window.garden diagnostic API
 * State is kept in closure to prevent stale state across hot reloads
 */
export function initDiagnostics(_workerUrl: string): void {
  const pageContext = getPageContext(location.pathname);
  const surfaces = getSurfaces(pageContext);

  // Create closure-scoped state for visualization modes
  const xrayState = createXrayState();
  const exploreState = createExploreState();

  // Create mode functions with state
  const xray = createXrayMode(xrayState, surfaces);
  const explore = createExploreMode(exploreState, surfaces);

  // --- surfaces() ---
  function surfacesList(): void {
    console.log('%c🌿 surfaces (' + pageContext + ')', styles.header);
    const data = surfaces.map(s => ({
      name: s.name,
      type: s.type,
      count: document.querySelectorAll(s.selector).length
    }));
    const present = data.filter(s => s.count > 0);
    const absent = data.filter(s => s.count === 0);

    if (present.length > 0) {
      console.table(present);
    }
    if (absent.length > 0) {
      console.log('%c\nnot found on this page:', styles.muted);
      console.log('%c' + absent.map(s => s.name).join(', '), styles.body);
    }
    console.log('%c\ntry garden.xray() to see them.', styles.muted);
  }

  // --- tend() wrapper with console output ---
  async function tend(password: string, deviceName?: string): Promise<void> {
    const result = await authTend(password, deviceName);

    if (result.banned) {
      console.log('%c🌿 access revoked.', styles.body);
      console.log('%cthe gate is closed to this browser.', styles.muted);
      return;
    }

    if (!result.success) {
      console.log('%c🌿 the garden does not recognize you.', styles.body);
      if (result.attemptsRemaining !== undefined) {
        if (result.attemptsRemaining === 0) {
          console.log('%cthe gate is now closed.', styles.muted);
        } else {
          console.log(`%c${result.attemptsRemaining} attempt(s) remaining.`, styles.muted);
        }
      }
      return;
    }

    // Success - prompt for device name if not provided
    let devId = result.deviceId;
    if (devId === 'unnamed') {
      devId = prompt('Name this device (for your own tracking):') || 'unnamed';
      try {
        localStorage.setItem('jardin-dev-id', devId);
      } catch {
        // localStorage unavailable
      }
    }

    console.log('%c🌿 the gardener is recognized.', styles.header);
    console.log(`%cdevice: ${devId}`, styles.body);
    console.log('%cyour visits are now tracked as dev traffic.', styles.muted);
  }

  // --- untend() wrapper with console output ---
  function untend(): void {
    authUntend();
    console.log('%c🌿 the gardener steps away.', styles.header);
    console.log('%cyour visits are counted as regular traffic again.', styles.muted);
  }

  // --- amnesty() wrapper with console output ---
  async function amnesty(recoveryPhrase: string): Promise<void> {
    const success = await authAmnesty(recoveryPhrase);
    if (success) {
      console.log('%c🌿 the gate reopens.', styles.header);
    } else {
      console.log('%c🌿 ...', styles.muted);
    }
  }

  // Expose API
  window.garden = {
    surfaces: surfacesList,
    reflect,
    ecology,
    xray,
    explore,
    tend,
    untend,
    amnesty,
  };

  // Announce after devtools greeting (~3500ms)
  setTimeout(() => {
    console.log('%c\n🌿 diagnostic tools loaded.', styles.header);
    console.log('%ctry: garden.reflect() · garden.ecology() · garden.xray()', styles.muted);
    console.log('%cthe roots go deeper. try: micelio', styles.muted);
  }, 3500);
}
