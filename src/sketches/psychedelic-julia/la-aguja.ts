/**
 * la aguja — hyperfocus
 *
 * Sharp dendrites, high-contrast monochrome.
 * Clean, minimal grain, precise edges.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: -0.8,
  cImag: 0.156,
  cMorphRadius: 0,
  zoom: 1.4,
  palette: 'monochrome',
  glitchIntensity: 0.1,
  grainIntensity: 0.02,
  vignetteStrength: 0.25,
  chromaticShift: 0,
  animated: false,
});
