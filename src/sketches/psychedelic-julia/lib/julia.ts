/**
 * Julia set mathematics
 */

import type { P5Instance } from './types';

/**
 * Calculate Julia set iterations for a point using escape-time algorithm
 * Returns a smoothed iteration count for anti-aliased coloring
 *
 * @param x - Real component of z
 * @param y - Imaginary component of z
 * @param cReal - Real component of c constant
 * @param cImag - Imaginary component of c constant
 * @param maxIter - Maximum iterations before assuming convergence
 * @returns Smoothed iteration count (0 to maxIter)
 */
export function juliaIterations(
  x: number,
  y: number,
  cReal: number,
  cImag: number,
  maxIter: number
): number {
  let zx = x;
  let zy = y;
  let iter = 0;

  // Escape radius squared (2^2 = 4, but we use higher for smoother coloring)
  const escapeRadius = 4;

  while (iter < maxIter) {
    const zx2 = zx * zx;
    const zy2 = zy * zy;

    // Check escape condition
    if (zx2 + zy2 > escapeRadius) {
      // Smooth coloring: add fractional iteration based on escape magnitude
      const log_zn = Math.log(zx2 + zy2) / 2;
      const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
      return iter + 1 - nu;
    }

    // z = z^2 + c
    zy = 2 * zx * zy + cImag;
    zx = zx2 - zy2 + cReal;
    iter++;
  }

  return maxIter;
}

/**
 * Transform pixel coordinates to complex plane coordinates
 * with rotation, zoom, and distortion
 *
 * @param px - Pixel x coordinate
 * @param py - Pixel y coordinate
 * @param width - Canvas width
 * @param height - Canvas height
 * @param rotation - Rotation angle in radians
 * @param zoom - Zoom factor (higher = more zoomed in)
 * @param distortX - X-axis distortion offset
 * @param distortY - Y-axis distortion offset
 * @returns [x, y] complex plane coordinates
 */
export function transformCoord(
  px: number,
  py: number,
  width: number,
  height: number,
  rotation: number,
  zoom: number,
  distortX: number,
  distortY: number
): [number, number] {
  // Center and normalize to -1..1 range
  const aspectRatio = width / height;
  let x = ((px / width) * 2 - 1) * aspectRatio;
  let y = (py / height) * 2 - 1;

  // Apply zoom
  x /= zoom;
  y /= zoom;

  // Apply rotation
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;

  // Apply distortion
  return [rx + distortX, ry + distortY];
}

/**
 * Generate seamlessly looping noise value using circular sampling
 *
 * @param p - p5 instance for noise function
 * @param seedOffset - Offset to vary the noise pattern
 * @param radius - Radius of circular sampling path
 * @param loopFrame - Current frame in loop (1-indexed)
 * @param loopFrames - Total frames in loop
 * @returns Noise value 0-1
 */
export function loopNoise(
  p: P5Instance,
  seedOffset: number,
  radius: number,
  loopFrame: number,
  loopFrames: number
): number {
  const angle = ((loopFrame - 1) / loopFrames) * Math.PI * 2;
  return p.noise(seedOffset + Math.cos(angle) * radius, seedOffset + Math.sin(angle) * radius);
}
