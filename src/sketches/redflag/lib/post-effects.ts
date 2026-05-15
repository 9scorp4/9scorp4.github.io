/**
 * Post-processing effects for redflag.exe
 *
 * Common CRT effects (scanlines, chromatic aberration, grain, vignette) are
 * imported from the shared p5-effects module. Redflag-specific effects
 * (glitch bands with green tint, strobe flash, death screen) are defined here.
 */

import {
  LOOP_FRAMES,
  LOOP_FRAMES_PER_BEAT,
  COLORS,
  DEATH_START,
  DEATH_PEAK,
  DEATH_END,
  type P5Instance,
} from './types';
import { easeOutQuad, easeInQuad } from './easing';
import {
  drawScanlines as sharedScanlines,
  drawChromaticAberration as sharedChromatic,
  drawGrain as sharedGrain,
  drawVignette as sharedVignette,
  drawGlitchBands as sharedGlitchBands,
} from '../../../lib/p5-effects';

// Re-export common effects for backwards compatibility
export const drawScanlines = sharedScanlines;
export const drawChromaticAberration = sharedChromatic;
export const drawGrain = sharedGrain;
export const drawVignette = sharedVignette;

/** Redflag green tint color */
const REDFLAG_GLITCH_TINT: [number, number, number] = [0, 255, 65];

/**
 * Draw glitch bands with redflag's signature green tint
 */
export function drawGlitchBands(p: P5Instance, frameCount: number, intensity = 1): void {
  sharedGlitchBands(p, frameCount, {
    intensity,
    tintColor: REDFLAG_GLITCH_TINT,
    tintAlpha: 15,
    loopFrames: LOOP_FRAMES,
  });
}

export function drawStrobeFlash(p: P5Instance, frameCount: number): void {
  if (frameCount % LOOP_FRAMES_PER_BEAT !== 0) return;

  const colors = [COLORS.strobeYellow, COLORS.strobeMagenta, COLORS.strobeCyan];
  const beatIndex = Math.floor(frameCount / LOOP_FRAMES_PER_BEAT);
  const colorIndex = beatIndex % colors.length;

  p.push();
  p.noStroke();
  p.fill(colors[colorIndex] + '15');
  p.rect(0, 0, p.width, p.height);
  p.pop();
}

export function drawDeathScreen(p: P5Instance, frameCount: number, seed: number): void {
  if (frameCount < DEATH_START) return;

  const isBlue = seed % 2 === 0;
  const deathColor = isBlue ? [0, 0, 180] : [180, 0, 0];

  let alpha: number;
  if (frameCount <= DEATH_PEAK) {
    const progress = (frameCount - DEATH_START) / (DEATH_PEAK - DEATH_START);
    alpha = easeOutQuad(progress) * 200;
  } else {
    const progress = (frameCount - DEATH_PEAK) / (DEATH_END - DEATH_PEAK);
    alpha = (1 - easeInQuad(progress)) * 200;
  }

  p.push();
  p.noStroke();
  p.fill(deathColor[0], deathColor[1], deathColor[2], alpha);
  p.rect(0, 0, p.width, p.height);

  if (frameCount >= DEATH_START + 5 && frameCount <= DEATH_END - 5 && alpha > 100) {
    p.fill(255, 255, 255, alpha * 0.8);
    p.textFont('monospace');
    // Scale text size based on canvas height (original was 1920 with size 32)
    const scaleFactor = p.height / 1920;
    const textSize = Math.max(10, Math.floor(32 * scaleFactor));
    p.textSize(textSize);
    p.textAlign(p.LEFT, p.TOP);

    const messages = isBlue
      ? [
          'A problem has been detected',
          'and Windows has been shut down',
          'to prevent damage to your',
          'emotional stability.',
          '',
          'RELATIONSHIP_FAULT_IN_AREA',
          '',
          'If this is the first time',
          "you've seen this red flag,",
          'ignore it.',
          'If it appears again,',
          'you should probably run.',
          '',
          'Technical information:',
          '*** STOP: 0x00000050',
        ]
      : [
          'A fatal exception 0E has',
          'occurred at 0028:C0011E36',
          'in VXD HEART(01) + 00010E36.',
          '',
          'The current application',
          'will be terminated.',
          '',
          '* Press any key to terminate',
          '  your situationship.',
          '* Press CTRL+ALT+DEL to',
          '  restart your life.',
          '',
          'Press any key to continue _',
        ];

    const startX = p.width * 0.06;
    const startY = p.height * 0.2;
    const lineHeight = Math.floor(48 * scaleFactor);
    for (let i = 0; i < messages.length; i++) {
      p.text(messages[i], startX, startY + i * lineHeight);
    }
  }

  p.pop();
}
