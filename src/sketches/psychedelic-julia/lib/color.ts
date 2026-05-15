/**
 * Color conversion utilities
 */

/**
 * Convert HSB (Hue, Saturation, Brightness) to RGB
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param b - Brightness (0-100)
 * @returns [r, g, b] array with values 0-255
 */
export function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  // Normalize inputs
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  b = Math.max(0, Math.min(100, b)) / 100;

  const c = b * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = b - c;

  let r = 0,
    g = 0,
    bl = 0;

  if (h < 60) {
    r = c;
    g = x;
    bl = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    bl = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    bl = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    bl = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    bl = c;
  } else {
    r = c;
    g = 0;
    bl = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((bl + m) * 255)];
}
