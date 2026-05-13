/**
 * garden-console/index.ts
 * Barrel exports for garden console modules
 */

// Types
export type { Surface, PageContext, ConsoleStyles } from './types';

// Auth
export {
  DEV_HASH,
  AMNESTY_HASH,
  MAX_FAILED_ATTEMPTS,
  BAN_KEY,
  ATTEMPTS_KEY,
  DEV_ID_KEY,
  DEV_KEY,
  sha256,
  tend,
  untend,
  amnesty,
  handleTendParam,
} from './auth';
export type { TendResult } from './auth';

// Tracking
export {
  getTrackingState,
  trackPageview,
  setupOutboundTracking,
} from './tracking';
export type { TrackingState } from './tracking';

// Devtools greeting
export { showGreeting } from './devtools';

// Diagnostics (window.garden API)
export { getPageContext, initDiagnostics } from './diagnostics';
