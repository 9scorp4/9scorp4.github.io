/**
 * redflag-utils.ts - Shared utilities for redflag.exe sketches
 *
 * Ported from animation-sandbox to TypeScript ES modules with p5 instance mode.
 * Provides: DigitalRain, FeedbackBuffer, DialogWindow, WindowManager,
 * and post-processing effects.
 *
 * This is a barrel file - all implementations are in separate modules.
 */

// Easing functions
export { easeOutBack, easeInQuad, easeOutQuad } from './easing';

// Digital rain effect
export { loopNoise, DigitalRain } from './digital-rain';

// Feedback buffer for trail effects
export { FeedbackBuffer } from './feedback-buffer';

// Dialog window system
export { DialogWindow, WindowManager } from './dialog-window';

// Post-processing effects
export {
  drawScanlines,
  drawChromaticAberration,
  drawGrain,
  drawVignette,
  drawGlitchBands,
  drawStrobeFlash,
  drawDeathScreen,
} from './post-effects';
