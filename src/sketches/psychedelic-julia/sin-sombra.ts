/**
 * sin sombra — mania
 *
 * Radiating dendrites, saturated colors.
 * Explosive energy, no center to hold it.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: 0.285,
  cImag: 0.01,
  cMorphRadius: 0.25,
  zoom: 0.9,
  palette: 'saturated',
  glitchIntensity: 0.85,
  grainIntensity: 0.1,
  vignetteStrength: 0.2,
  chromaticShift: 2.5,
  glitchTint: [255, 220, 100],
  animated: true,
});
