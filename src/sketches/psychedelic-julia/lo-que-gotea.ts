/**
 * lo que gotea — melancholy
 *
 * Drooping tendrils, cool blues and purples.
 * Heavy vignette, slow descent.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: -0.7269,
  cImag: 0.1889,
  cMorphRadius: 0.03,
  zoom: 1.2,
  palette: 'cold',
  glitchIntensity: 0.3,
  grainIntensity: 0.06,
  vignetteStrength: 0.55,
  chromaticShift: 1.2,
  glitchTint: [100, 80, 180],
  animated: true,
});
