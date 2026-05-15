/**
 * Mood-based color palettes for Julia set variants
 *
 * Each palette maps iteration count to RGB color, creating distinct
 * psychological atmospheres for each specimen.
 */

import type { Palette } from './types';
import { hsbToRgb } from './color';

type RGB = [number, number, number];

/**
 * Get color for a given iteration count using the specified palette
 *
 * @param palette - Named palette to use
 * @param iter - Current iteration (smoothed)
 * @param maxIter - Maximum iterations
 * @param hueOffset - Animation offset for cycling palettes (0-360)
 * @returns RGB tuple [r, g, b]
 */
export function getPaletteColor(
  palette: Palette,
  iter: number,
  maxIter: number,
  hueOffset: number = 0
): RGB {
  // Normalize iteration to 0-1
  const t = iter / maxIter;

  switch (palette) {
    case 'cycling':
      return cyclingPalette(iter, t, hueOffset);
    case 'warm':
      return warmPalette(iter, t);
    case 'cold':
      return coldPalette(iter, t);
    case 'pale':
      return palePalette(iter, t);
    case 'monochrome':
      return monochromePalette(iter, t);
    case 'saturated':
      return saturatedPalette(iter, t, hueOffset);
    default:
      return cyclingPalette(iter, t, hueOffset);
  }
}

/**
 * Full spectrum cycling - rumination (el bucle)
 * Mind looping through all emotional states
 */
function cyclingPalette(iter: number, t: number, hueOffset: number): RGB {
  const hue = (iter * 8 + hueOffset) % 360;
  const saturation = 85;
  const brightness = 70 + t * 30;
  return hsbToRgb(hue, saturation, brightness);
}

/**
 * Warm reds/oranges/yellows - anxiety (espiral estrecha)
 * Tight, heated, urgent
 */
function warmPalette(iter: number, t: number): RGB {
  // Hue oscillates between red (0), orange (30), and yellow (50)
  const hue = (iter * 3) % 60;
  const saturation = 80 + t * 20;
  const brightness = 60 + t * 35;
  return hsbToRgb(hue, saturation, brightness);
}

/**
 * Cool blues/purples - melancholy (lo que gotea)
 * Heavy, slow, drooping
 */
function coldPalette(iter: number, t: number): RGB {
  // Hue range: blue (200) to purple (280)
  const hue = 200 + (iter * 2) % 80;
  const saturation = 60 + t * 30;
  const brightness = 50 + t * 40;
  return hsbToRgb(hue, saturation, brightness);
}

/**
 * Desaturated blues/grays - dissociation (el disperso)
 * Faded, distant, scattered
 */
function palePalette(iter: number, t: number): RGB {
  // Cool hues but very low saturation
  const hue = 200 + (iter * 1.5) % 60;
  const saturation = 15 + t * 20;
  const brightness = 60 + t * 35;
  return hsbToRgb(hue, saturation, brightness);
}

/**
 * High-contrast grayscale - hyperfocus (la aguja)
 * Sharp, precise, black/white
 */
function monochromePalette(iter: number, t: number): RGB {
  // Use iteration bands for stark contrast
  const band = Math.floor(iter / 4) % 2;
  const base = band === 0 ? 40 : 80;
  const brightness = base + t * (100 - base);
  const value = Math.round((brightness / 100) * 255);
  return [value, value, value];
}

/**
 * Maximum saturation all colors - mania (sin sombra)
 * Bright, fast, overwhelming
 */
function saturatedPalette(iter: number, t: number, hueOffset: number): RGB {
  // Full spectrum but at maximum saturation and brightness
  const hue = (iter * 12 + hueOffset * 2) % 360; // Faster cycling
  const saturation = 100;
  const brightness = 80 + t * 20;
  return hsbToRgb(hue, saturation, brightness);
}
