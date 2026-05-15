/**
 * espiral estrecha — anxiety
 *
 * Tight spirals, warm reds and oranges.
 * Heavy glitch, jittery motion.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: -0.75,
  cImag: 0.11,
  cMorphRadius: 0.08,
  zoom: 1.5,
  palette: 'warm',
  glitchIntensity: 0.8,
  grainIntensity: 0.12,
  vignetteStrength: 0.45,
  chromaticShift: 2.5,
  glitchTint: [255, 100, 50],
  animated: true,
});
