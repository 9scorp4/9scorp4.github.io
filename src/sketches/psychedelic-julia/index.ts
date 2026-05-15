/**
 * Psychedelic Julia set series — barrel export
 *
 * A family of Julia fractal sketches exploring psychological states,
 * each with distinct c-values, palettes, and post-processing.
 *
 * For backwards compatibility, this module re-exports el-bucle as the
 * default createSketch (the original morphing Julia).
 */

// Factory for creating custom variants
export { createJuliaSketch } from './lib/factory';

// Types
export type { VariantConfig, Palette } from './lib/types';

// Default export: el bucle (rumination) - the original morphing Julia
export { createSketch } from './el-bucle';
