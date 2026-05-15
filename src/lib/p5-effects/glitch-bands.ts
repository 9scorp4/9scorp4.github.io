/**
 * Glitch bands effect with configurable tint color
 *
 * Creates horizontal displacement bands that slice and shift the image,
 * optionally applying a color tint overlay.
 */

import type p5 from 'p5';

export type P5Instance = p5;

export interface GlitchBandsOptions {
  /** Intensity multiplier for number of bands (default: 1) */
  intensity?: number;
  /** RGB tint color for band overlay [r, g, b] (default: green [0, 255, 65]) */
  tintColor?: [number, number, number];
  /** Alpha for tint overlay 0-255 (default: 15) */
  tintAlpha?: number;
  /** Total frames in animation loop (default: 180) */
  loopFrames?: number;
}

/**
 * Draw animated glitch displacement bands
 *
 * @param p - p5 instance
 * @param frameCount - Current frame number (1-based for seamless looping)
 * @param options - Configuration options
 */
export function drawGlitchBands(
  p: P5Instance,
  frameCount: number,
  options: GlitchBandsOptions = {}
): void {
  const {
    intensity = 1,
    tintColor = [0, 255, 65],
    tintAlpha = 15,
    loopFrames = 180,
  } = options;

  const glitchAngle = (frameCount / loopFrames) * Math.PI * 2 * 6;
  const numBands = Math.floor(
    p.noise(500, Math.cos(glitchAngle) * 1.5, Math.sin(glitchAngle) * 1.5) * 4 * intensity
  );

  p.push();
  p.noStroke();

  for (let b = 0; b < numBands; b++) {
    const bandY =
      p.noise(b * 50, Math.cos(glitchAngle) * 1.5, Math.sin(glitchAngle) * 1.5) * p.height;
    const bandHeight = p.noise(b * 100, Math.cos(glitchAngle), Math.sin(glitchAngle)) * 10 + 2;
    const bandShift =
      (p.noise(b * 150, Math.cos(glitchAngle) * 2, Math.sin(glitchAngle) * 2) - 0.5) * 60;

    const slice = p.get(0, bandY, p.width, bandHeight);
    p.image(slice, bandShift, bandY);

    // Apply tint overlay on some bands
    if (p.noise(b * 200, Math.cos(glitchAngle), Math.sin(glitchAngle)) > 0.6) {
      p.fill(tintColor[0], tintColor[1], tintColor[2], tintAlpha);
      p.rect(0, bandY, p.width, bandHeight);
    }
  }
  p.pop();
}
