/**
 * el bucle — rumination
 *
 * Morphing Julia set. The mind that won't stop looping.
 * Cycling hues, medium glitch, continuous motion.
 */

import { createJuliaSketch } from './lib/factory';

export const createSketch = createJuliaSketch({
  cReal: -0.7,
  cImag: 0.27,
  cMorphRadius: 0.15,
  zoom: 1.3,
  palette: 'cycling',
  glitchIntensity: 0.5,
  grainIntensity: 0.08,
  vignetteStrength: 0.35,
  chromaticShift: 1.5,
  animated: true,
});
