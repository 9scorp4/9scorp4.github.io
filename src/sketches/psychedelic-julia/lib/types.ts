/**
 * Constants and types for psychedelic-julia sketch
 */

import type p5 from 'p5';

// Animation timing
export const LOOP_FRAMES = 180; // 12s at 15fps
export const FRAME_RATE = 15;

// Julia set parameters
export const MAX_ITER = 80;

// Post-processing
export const GLITCH_TINT: [number, number, number] = [180, 50, 200]; // Purple tint

export type P5Instance = p5;

// ============================================================
// VARIANT SYSTEM
// ============================================================

/**
 * Named palettes for psychological states
 */
export type Palette =
  | 'cycling' // full spectrum rotation (rumination)
  | 'warm' // reds/oranges/yellows (anxiety)
  | 'cold' // blues/cyans (melancholy)
  | 'pale' // desaturated blues/grays (dissociation)
  | 'monochrome' // high-contrast grayscale (hyperfocus)
  | 'saturated'; // all colors at max saturation (mania)

/**
 * Configuration for a Julia set variant
 */
export interface VariantConfig {
  // Julia c-parameter
  cReal: number;
  cImag: number;

  // Morphing: if > 0, c orbits around (cReal, cImag) with this radius
  cMorphRadius: number;

  // View parameters
  zoom: number;

  // Palette
  palette: Palette;

  // Effects intensity (0-1 scale)
  glitchIntensity: number;
  grainIntensity: number;
  vignetteStrength: number;
  chromaticShift: number;

  // Glitch tint color (RGB)
  glitchTint?: [number, number, number];

  // Animation
  animated: boolean;
}
