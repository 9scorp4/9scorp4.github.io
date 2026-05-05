/**
 * redflag.exe sketch series
 *
 * Windows 95 error dialogs with CRT effects, digital rain, and feedback trails.
 *
 * Structure:
 * - lib/           — shared implementation
 *   - factory.ts   — sketch factory function
 *   - types.ts     — SketchOptions, SketchInstance, timing constants
 *   - utils.ts     — DigitalRain, FeedbackBuffer, WindowManager, post-processing
 *
 * Specimens (each a 2-line wrapper around the factory):
 * - avoidant.ts
 * - boundaries.ts
 * - emotional-unavailability.ts
 * - hyperfixation.ts
 * - nervous-system.ts
 * - personality.ts
 * - situationship.ts
 * - vibe-check.ts
 * - vulnerability.ts
 * - winter.ts
 */

export { createRedflagSketch } from './lib/factory';
export { type SketchOptions, type SketchInstance, LOOP_FRAMES } from './lib/types';
