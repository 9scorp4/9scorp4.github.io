/**
 * Shared post-processing effects for p5.js sketches
 *
 * These effects are used across multiple specimen sketches (redflag, psychedelic-julia, etc.)
 * to create consistent CRT/VHS aesthetic.
 */

import type p5 from 'p5';

export type P5Instance = p5;

/**
 * Draw horizontal scanlines across the canvas
 */
export function drawScanlines(p: P5Instance): void {
  p.push();
  p.stroke(0, 0, 0, 12);
  p.strokeWeight(1);
  for (let y = 0; y < p.height; y += 3) {
    p.line(0, y, p.width, y);
  }
  p.pop();
}

/**
 * Apply RGB channel separation for chromatic aberration effect
 */
export function drawChromaticAberration(p: P5Instance, shift = 2): void {
  p.loadPixels();
  const d = p.pixelDensity();
  const w = p.width * d;
  const h = p.height * d;
  const pixelShift = Math.floor(shift * d);

  const original = p.pixels.slice();

  for (let y = 0; y < h; y++) {
    for (let x = pixelShift; x < w - pixelShift; x++) {
      const i = (y * w + x) * 4;
      const iLeft = (y * w + (x - pixelShift)) * 4;
      const iRight = (y * w + (x + pixelShift)) * 4;

      p.pixels[i] = original[iRight]; // Red from right
      p.pixels[i + 2] = original[iLeft + 2]; // Blue from left
    }
  }
  p.updatePixels();
}

/**
 * Add random film grain noise to pixels
 */
export function drawGrain(p: P5Instance, density = 0.15): void {
  p.loadPixels();
  const d = p.pixelDensity();
  const totalPixels = 4 * (p.width * d) * (p.height * d);
  const numGrainPixels = Math.floor((totalPixels / 4) * density);

  for (let n = 0; n < numGrainPixels; n++) {
    const i = Math.floor(p.random(totalPixels / 4)) * 4;
    const grainValue = p.random(-50, 50);
    p.pixels[i] = p.constrain(p.pixels[i] + grainValue, 0, 255);
    p.pixels[i + 1] = p.constrain(p.pixels[i + 1] + grainValue, 0, 255);
    p.pixels[i + 2] = p.constrain(p.pixels[i + 2] + grainValue, 0, 255);
  }
  p.updatePixels();
}

/**
 * Draw radial vignette darkening toward edges
 */
export function drawVignette(
  p: P5Instance,
  innerRadius = 0.4,
  outerRadius = 0.8,
  alpha = 0.4
): void {
  p.push();
  p.noStroke();
  const ctx = (p as any).drawingContext as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(
    p.width / 2,
    p.height / 2,
    p.height * innerRadius,
    p.width / 2,
    p.height / 2,
    p.height * outerRadius
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, p.width, p.height);
  p.pop();
}

export { drawGlitchBands, type GlitchBandsOptions } from './glitch-bands';
