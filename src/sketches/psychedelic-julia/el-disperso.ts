/**
 * el disperso — dissociation
 *
 * Scattered dust, pale blues and grays.
 * Soft, low contrast, slow drift.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: -0.4,
  cImag: 0.6,
  cMorphRadius: 0.05,
  zoom: 1.1,
  palette: 'pale',
  glitchIntensity: 0.15,
  grainIntensity: 0.04,
  vignetteStrength: 0.2,
  chromaticShift: 0.8,
  glitchTint: [150, 180, 200],
  animated: true,
});
