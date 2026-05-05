/**
 * redflag: personality
 *
 * Windows 95 error dialog with feedback buffer trails,
 * digital rain background, and CRT effects.
 *
 * Part of the redflag.exe series.
 */

import p5 from 'p5';
import {
  DigitalRain,
  FeedbackBuffer,
  WindowManager,
  drawScanlines,
  drawChromaticAberration,
  drawGrain,
  drawVignette,
  drawGlitchBands,
  drawStrobeFlash,
  drawDeathScreen,
} from './utils';
import { LOOP_FRAMES, type SketchOptions, type SketchInstance } from './types';

// Dialog image path (relative to public)
const DIALOG_IMAGE = '/assets/redflag/personality.png';

export function createSketch(
  container: HTMLElement,
  options: SketchOptions
): SketchInstance {
  const { width, height, reducedMotion = false, seed = Date.now() } = options;

  let p5Instance: p5 | null = null;

  p5Instance = new p5((p: p5) => {
    let dialogImg: p5.Image;
    let digitalRain: DigitalRain;
    let feedbackBuffer: FeedbackBuffer;
    let windowManager: WindowManager;
    let loopFrame = 1;
    let isRunning = true;

    p.preload = () => {
      dialogImg = p.loadImage(DIALOG_IMAGE);
    };

    p.setup = () => {
      // Use a fixed internal resolution for consistent rendering
      // Scale based on container height to fill the space
      const baseHeight = 640;
      const baseWidth = Math.floor(baseHeight * (9 / 16));

      // Scale up if container is larger
      const scale = Math.max(1, Math.min(height / baseHeight, width / baseWidth));
      const canvasWidth = Math.floor(baseWidth * scale);
      const canvasHeight = Math.floor(baseHeight * scale);

      p.createCanvas(canvasWidth, canvasHeight);
      p.randomSeed(seed);
      p.noiseSeed(seed);
      p.frameRate(15);

      digitalRain = new DigitalRain(p, seed);
      feedbackBuffer = new FeedbackBuffer(p, 220);
      windowManager = new WindowManager(p, dialogImg, seed);

      // If reduced motion, just draw one frame and stop
      if (reducedMotion) {
        p.noLoop();
      }
    };

    p.draw = () => {
      if (!isRunning) return;

      // Near-black background
      p.background(5, 5, 5);

      // Digital rain layer
      digitalRain.draw(loopFrame);

      // Feedback buffer: draw decayed previous frame
      feedbackBuffer.begin();

      // Update and draw dialog windows
      windowManager.update(loopFrame);
      windowManager.draw(loopFrame);

      // Capture current state for feedback
      feedbackBuffer.capture();

      // Post-processing effects
      drawGlitchBands(p, loopFrame, 0.7);
      drawScanlines(p);
      drawStrobeFlash(p, loopFrame);
      drawDeathScreen(p, loopFrame, seed);
      drawChromaticAberration(p, 2);
      drawGrain(p, 0.12);
      drawVignette(p, 0.35, 0.85, 0.5);

      // Loop frame counter
      loopFrame++;
      if (loopFrame > LOOP_FRAMES) {
        loopFrame = 1;
        // Reset systems for seamless loop
        p.randomSeed(seed);
        p.noiseSeed(seed);
        digitalRain = new DigitalRain(p, seed);
        feedbackBuffer.clear();
        windowManager = new WindowManager(p, dialogImg, seed);
      }
    };

    // Cleanup method called by modal
    (p as any).cleanup = () => {
      isRunning = false;
      try {
        feedbackBuffer?.remove();
      } catch {
        // Ignore cleanup errors
      }
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
}
