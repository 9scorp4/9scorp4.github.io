/**
 * Julia set sketch factory
 *
 * Creates parameterized Julia fractal sketches with configurable
 * c-values, palettes, and post-processing effects.
 *
 * Part of the psychedelic-julia series.
 */

import p5 from 'p5';
import type { SketchOptions, SketchInstance } from '../../../lib/specimen-modal/types';
import {
  LOOP_FRAMES,
  FRAME_RATE,
  MAX_ITER,
  GLITCH_TINT,
  type P5Instance,
  type VariantConfig,
} from './types';
import { juliaIterations, transformCoord, loopNoise } from './julia';
import { getPaletteColor } from './palettes';
import {
  drawScanlines,
  drawChromaticAberration,
  drawGrain,
  drawVignette,
  drawGlitchBands,
} from '../../../lib/p5-effects';

/**
 * Create a Julia set sketch with the given configuration
 *
 * @param config - Variant configuration
 * @returns Factory function that creates the sketch instance
 */
export function createJuliaSketch(config: VariantConfig) {
  return function createSketch(
    container: HTMLElement,
    options: SketchOptions
  ): SketchInstance {
    const { width, height, reducedMotion = false } = options;

    // Merge reducedMotion preference with config's animated flag
    const shouldAnimate = config.animated && !reducedMotion;

    let p5Instance: p5 | null = null;

    p5Instance = new p5((p: P5Instance) => {
      let loopFrame = 1;
      let isRunning = true;

      // Scaled-down rendering resolution for performance
      let renderWidth: number;
      let renderHeight: number;

      p.setup = () => {
        // Use lower internal resolution for pixel rendering
        const maxHeight = 480;
        const scale = Math.min(1, maxHeight / height);
        renderHeight = Math.floor(height * scale);
        renderWidth = Math.floor(width * scale);

        p.createCanvas(renderWidth, renderHeight);
        p.pixelDensity(1);
        p.frameRate(FRAME_RATE);
        p.noSmooth();

        if (!shouldAnimate) {
          // Draw one frame and stop
          drawJuliaFrame(p, 1);
          applyPostEffects(p, 1);
          p.noLoop();
        }
      };

      p.draw = () => {
        if (!isRunning) return;

        drawJuliaFrame(p, loopFrame);
        applyPostEffects(p, loopFrame);

        loopFrame++;
        if (loopFrame > LOOP_FRAMES) {
          loopFrame = 1;
        }
      };

      function drawJuliaFrame(p: P5Instance, frame: number): void {
        p.loadPixels();

        // Calculate c-parameter (static or morphing)
        let cReal = config.cReal;
        let cImag = config.cImag;

        if (config.cMorphRadius > 0) {
          // Animate c on a circular path for seamless looping
          const cAngle = ((frame - 1) / LOOP_FRAMES) * Math.PI * 2;
          cReal += Math.cos(cAngle) * config.cMorphRadius;
          cImag += Math.sin(cAngle) * config.cMorphRadius;
        }

        // Animated parameters using looped noise (subtle movement)
        const rotation = loopNoise(p, 100, 1.5, frame, LOOP_FRAMES) * Math.PI * 0.15;
        const zoomNoise = loopNoise(p, 200, 1.5, frame, LOOP_FRAMES) * 0.2;
        const zoom = config.zoom + zoomNoise;
        const distortX = (loopNoise(p, 300, 1.5, frame, LOOP_FRAMES) - 0.5) * 0.08;
        const distortY = (loopNoise(p, 400, 1.5, frame, LOOP_FRAMES) - 0.5) * 0.08;

        // Hue offset cycles through full spectrum (for palettes that use it)
        const hueOffset = (frame / LOOP_FRAMES) * 360;

        const d = p.pixelDensity();
        const w = p.width * d;
        const h = p.height * d;

        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const [x, y] = transformCoord(px, py, w, h, rotation, zoom, distortX, distortY);

            const iter = juliaIterations(x, y, cReal, cImag, MAX_ITER);

            let r: number, g: number, b: number;

            if (iter >= MAX_ITER) {
              // Inside the set: dark
              r = g = b = 0;
            } else {
              // Outside: use palette
              [r, g, b] = getPaletteColor(config.palette, iter, MAX_ITER, hueOffset);
            }

            const i = (py * w + px) * 4;
            p.pixels[i] = r;
            p.pixels[i + 1] = g;
            p.pixels[i + 2] = b;
            p.pixels[i + 3] = 255;
          }
        }

        p.updatePixels();
      }

      function applyPostEffects(p: P5Instance, frame: number): void {
        // Apply effects based on config intensities
        if (config.glitchIntensity > 0) {
          drawGlitchBands(p, frame, {
            intensity: config.glitchIntensity,
            tintColor: config.glitchTint ?? GLITCH_TINT,
            tintAlpha: 20,
            loopFrames: LOOP_FRAMES,
          });
        }

        drawScanlines(p);

        if (config.chromaticShift > 0) {
          drawChromaticAberration(p, config.chromaticShift);
        }

        if (config.grainIntensity > 0) {
          drawGrain(p, config.grainIntensity);
        }

        if (config.vignetteStrength > 0) {
          drawVignette(p, 0.3, 0.9, config.vignetteStrength);
        }
      }

      // Cleanup method called by modal
      (p as any).cleanup = () => {
        isRunning = false;
      };
    }, container);

    return {
      remove: () => {
        if (p5Instance) {
          try {
            (p5Instance as any).cleanup?.();
            p5Instance.remove();
          } catch {
            // Ignore cleanup errors
          }
          p5Instance = null;
        }
      },
    };
  };
}
