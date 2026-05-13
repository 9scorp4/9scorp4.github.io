/**
 * Post-processing effects for redflag.exe
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

export function drawScanlines(p: P5Instance): void {
  p.push();
  p.stroke(0, 0, 0, 12);
  p.strokeWeight(1);
  for (let y = 0; y < p.height; y += 3) {
    p.line(0, y, p.width, y);
  }
  p.pop();
}

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

      p.pixels[i] = original[iRight];
      p.pixels[i + 2] = original[iLeft + 2];
    }
  }
  p.updatePixels();
}

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

export function drawGlitchBands(p: P5Instance, frameCount: number, intensity = 1): void {
  const glitchAngle = (frameCount / LOOP_FRAMES) * Math.PI * 2 * 6;
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

    if (p.noise(b * 200, Math.cos(glitchAngle), Math.sin(glitchAngle)) > 0.6) {
      p.fill(0, 255, 65, 15);
      p.rect(0, bandY, p.width, bandHeight);
    }
  }
  p.pop();
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
