/**
 * redflag-utils.ts - Shared utilities for redflag.exe sketches
 *
 * Ported from animation-sandbox to TypeScript ES modules with p5 instance mode.
 * Provides: DigitalRain, FeedbackBuffer, DialogWindow, WindowManager,
 * and post-processing effects.
 */

import type p5 from 'p5';
import {
  LOOP_FRAMES,
  LOOP_FRAMES_PER_BEAT,
  WINDOW_DEADLINE,
  DEATH_START,
  DEATH_PEAK,
  DEATH_END,
  COLORS,
  WindowState,
  type RainColumn,
  type DissolveSlice,
  type P5Instance,
} from './types';

// ============================================================
// EASING FUNCTIONS
// ============================================================

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// ============================================================
// LOOPING NOISE HELPER
// ============================================================

export function loopNoise(p: P5Instance, seed: number, radius: number, frameCount: number): number {
  const angle = (frameCount / LOOP_FRAMES) * Math.PI * 2;
  return p.noise(seed + Math.cos(angle) * radius, seed + Math.sin(angle) * radius);
}

// ============================================================
// DIGITAL RAIN SYSTEM
// ============================================================

export class DigitalRain {
  private p: P5Instance;
  private columns: RainColumn[];
  private charSet = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789[]{}()';
  private columnWidth: number;
  private numColumns: number;
  private spacing: number;
  private wrapHeight: number;
  private textSize: number;

  constructor(p: P5Instance, seed: number) {
    this.p = p;
    this.columns = [];
    // Scale based on canvas height (original was 1920)
    const scaleFactor = p.height / 1920;
    this.columnWidth = Math.max(10, Math.floor(22 * scaleFactor));
    this.spacing = Math.max(10, Math.floor(22 * scaleFactor));
    this.textSize = Math.max(8, Math.floor(18 * scaleFactor));
    this.numColumns = Math.ceil(p.width / this.columnWidth);
    this.wrapHeight = p.height + this.spacing * 5;

    // Initialize columns with seeded randomness
    p.randomSeed(seed + 9999);
    for (let i = 0; i < this.numColumns; i++) {
      const cycles = Math.floor(p.random(1, 4));
      const speed = (cycles * this.wrapHeight) / LOOP_FRAMES;

      this.columns.push({
        x: i * this.columnWidth + this.columnWidth / 2,
        speed,
        offset: p.random(this.wrapHeight),
        active: p.random() < 0.35,
        chars: this.generateChars(p, 40),
        noiseSeed: p.random(1000),
      });
    }
    p.randomSeed(seed);
  }

  private generateChars(p: P5Instance, count: number): string[] {
    const chars: string[] = [];
    for (let i = 0; i < count; i++) {
      chars.push(this.charSet[Math.floor(p.random(this.charSet.length))]);
    }
    return chars;
  }

  draw(frameCount: number): void {
    const p = this.p;
    p.push();
    p.textFont('monospace');
    p.textSize(this.textSize);
    p.textAlign(p.CENTER, p.CENTER);

    const loopAngle = ((frameCount - 1) / LOOP_FRAMES) * Math.PI * 2;

    for (const col of this.columns) {
      if (!col.active) continue;

      const numChars = Math.ceil(p.height / this.spacing) + 5;

      for (let i = 0; i < numChars; i++) {
        let y = (col.offset + i * this.spacing + frameCount * col.speed) % this.wrapHeight;
        y -= this.spacing * 2;

        if (y < -this.spacing || y > p.height + this.spacing) continue;

        const charNoise = p.noise(
          col.noiseSeed + i * 0.5,
          Math.cos(loopAngle * 3) * 2,
          Math.sin(loopAngle * 3) * 2
        );
        const charIdx = Math.floor(charNoise * col.chars.length) % col.chars.length;
        const char = col.chars[charIdx];

        const isHead = i === 0;
        const fade = isHead ? 1 : Math.max(0, 1 - i / 25);

        if (isHead) {
          p.fill(255, 255, 255, 255 * fade);
        } else {
          const g = p.lerp(200, 50, 1 - fade);
          p.fill(0, g, 20, 255 * fade);
        }

        p.noStroke();
        p.text(char, col.x, y);
      }
    }
    p.pop();
  }
}

// ============================================================
// FEEDBACK BUFFER
// ============================================================

export class FeedbackBuffer {
  private p: P5Instance;
  private buffer: p5.Graphics;
  private decayAlpha: number;

  constructor(p: P5Instance, decayAlpha = 220) {
    this.p = p;
    this.buffer = p.createGraphics(p.width, p.height);
    this.decayAlpha = decayAlpha;
  }

  begin(): void {
    const p = this.p;
    p.push();
    p.tint(255, this.decayAlpha);
    p.image(this.buffer, 0, 0);
    p.pop();
  }

  capture(): void {
    this.buffer.clear();
    this.buffer.image(this.p.get(), 0, 0);
  }

  clear(): void {
    this.buffer.clear();
  }

  remove(): void {
    try {
      if (this.buffer) {
        this.buffer.remove();
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// DIALOG WINDOW CLASS
// ============================================================

export class DialogWindow {
  private p: P5Instance;
  private img: p5.Image;
  private spawnFrame: number;
  private seed: number;
  private state: WindowState = WindowState.POP_IN;

  private popInDuration = 8;
  private dissolveDuration = 12;
  private lifetimeFrames: number;
  private chaosEnd: number;

  private scale: number;
  private displayWidth: number;
  private displayHeight: number;

  private x: number;
  private y: number;
  private nextTeleportFrame: number;
  private stuckFrames = 0;
  private isStuck = false;

  private alpha = 0;
  private currentScale = 0;
  private dissolveOffset: DissolveSlice[] = [];
  private dissolveProgress = 0;

  constructor(p: P5Instance, img: p5.Image, spawnFrame: number, seed: number, scale: number) {
    this.p = p;
    this.img = img;
    this.spawnFrame = spawnFrame;
    this.seed = seed;
    this.scale = scale;

    const maxPossibleLife = WINDOW_DEADLINE - spawnFrame;
    const minLife = 45;
    const maxLife = Math.min(90, maxPossibleLife);
    this.lifetimeFrames = Math.floor(
      p.random(Math.max(minLife, 40), Math.max(maxLife, minLife + 5))
    );
    this.chaosEnd = this.lifetimeFrames - this.dissolveDuration;

    this.displayWidth = this.img.width * this.scale;
    this.displayHeight = this.img.height * this.scale;

    this.x = p.random(this.displayWidth / 2, p.width - this.displayWidth / 2);
    this.y = p.random(this.displayHeight / 2, p.height - this.displayHeight / 2);

    this.nextTeleportFrame = spawnFrame + Math.floor(p.random(8, 15));

    // Pre-generate dissolve slice offsets
    const sliceHeight = 4;
    const numSlices = Math.ceil(this.displayHeight / sliceHeight);
    for (let i = 0; i < numSlices; i++) {
      this.dissolveOffset.push({
        maxOffset: p.random(50, 150) * (p.random() > 0.5 ? 1 : -1),
        delay: Math.floor(p.random(0, 6)),
      });
    }
  }

  private getAge(frameCount: number): number {
    return frameCount - this.spawnFrame;
  }

  update(frameCount: number): void {
    const p = this.p;
    const age = this.getAge(frameCount);

    if (age < this.popInDuration) {
      this.state = WindowState.POP_IN;
    } else if (age < this.chaosEnd) {
      this.state = WindowState.CHAOS;
    } else if (age < this.lifetimeFrames) {
      this.state = WindowState.DISSOLVE;
    } else {
      this.state = WindowState.DEAD;
      return;
    }

    switch (this.state) {
      case WindowState.POP_IN: {
        const popProgress = age / this.popInDuration;
        this.currentScale = easeOutBack(popProgress) * this.scale;
        this.alpha = easeOutQuad(popProgress) * 255;
        break;
      }

      case WindowState.CHAOS: {
        this.currentScale = this.scale;
        this.alpha = 255;

        if (this.isStuck) {
          this.stuckFrames--;
          if (this.stuckFrames <= 0) {
            this.isStuck = false;
          }
        } else if (frameCount >= this.nextTeleportFrame) {
          this.x = p.random(this.displayWidth / 2, p.width - this.displayWidth / 2);
          this.y = p.random(this.displayHeight / 2, p.height - this.displayHeight / 2);
          this.nextTeleportFrame = frameCount + Math.floor(p.random(8, 15));

          if (p.random() < 0.15) {
            this.isStuck = true;
            this.stuckFrames = Math.floor(p.random(3, 6));
          }
        }

        if (!this.isStuck) {
          this.x += p.random(-3, 3);
          this.y += p.random(-3, 3);
          this.x = p.constrain(this.x, this.displayWidth / 2, p.width - this.displayWidth / 2);
          this.y = p.constrain(this.y, this.displayHeight / 2, p.height - this.displayHeight / 2);
        }
        break;
      }

      case WindowState.DISSOLVE: {
        const dissolveAge = age - this.chaosEnd;
        const dissolveProgress = dissolveAge / this.dissolveDuration;
        this.alpha = (1 - easeInQuad(dissolveProgress)) * 255;
        this.currentScale = this.scale;
        this.dissolveProgress = dissolveProgress;
        break;
      }
    }
  }

  draw(frameCount: number): void {
    if (this.state === WindowState.DEAD) return;

    const p = this.p;
    const age = this.getAge(frameCount);

    p.push();
    p.imageMode(p.CENTER);

    if (this.state === WindowState.DISSOLVE) {
      const sliceHeight = 4;
      const numSlices = Math.ceil(this.displayHeight / sliceHeight);
      const dissolveAge = age - this.chaosEnd;

      for (let i = 0; i < numSlices; i++) {
        const srcY = i * (this.img.height / numSlices);
        const srcH = this.img.height / numSlices;

        const slice = this.dissolveOffset[i];
        const sliceDelay = slice.delay;
        const sliceProgress = Math.max(
          0,
          (dissolveAge - sliceDelay) / (this.dissolveDuration - sliceDelay)
        );
        const offset = slice.maxOffset * easeInQuad(sliceProgress);

        const destY = this.y - this.displayHeight / 2 + i * sliceHeight;
        const destH = sliceHeight;

        p.push();
        p.tint(255, this.alpha);
        p.image(
          this.img,
          this.x + offset,
          destY + destH / 2,
          this.displayWidth,
          destH,
          0,
          srcY,
          this.img.width,
          srcH
        );
        p.pop();
      }
    } else {
      p.tint(255, this.alpha);
      const w = this.img.width * this.currentScale;
      const h = this.img.height * this.currentScale;
      p.image(this.img, this.x, this.y, w, h);
    }

    p.pop();
  }

  isDead(): boolean {
    return this.state === WindowState.DEAD;
  }
}

// ============================================================
// WINDOW MANAGER
// ============================================================

export class WindowManager {
  private p: P5Instance;
  private img: p5.Image;
  private seed: number;
  private windows: DialogWindow[] = [];
  private spawnSchedule: number[] = [];
  private spawnIndex = 0;
  private dialogScale: number;

  constructor(p: P5Instance, img: p5.Image, seed: number) {
    this.p = p;
    this.img = img;
    this.seed = seed;
    // Scale dialogs based on canvas height (original was 1920 with scale 2.0)
    this.dialogScale = p.height / 960;
    this.generateSpawnSchedule();
  }

  private generateSpawnSchedule(): void {
    const p = this.p;
    p.randomSeed(this.seed + 7777);

    this.spawnSchedule.push(1);

    let frame = 15;
    const LAST_SPAWN = 100;
    while (frame < LAST_SPAWN) {
      this.spawnSchedule.push(frame);
      frame += LOOP_FRAMES_PER_BEAT * Math.floor(p.random(1, 3));
    }

    p.randomSeed(this.seed);
  }

  update(frameCount: number): void {
    const p = this.p;

    while (
      this.spawnIndex < this.spawnSchedule.length &&
      frameCount >= this.spawnSchedule[this.spawnIndex]
    ) {
      p.randomSeed(this.seed + this.spawnIndex * 1000);
      this.windows.push(new DialogWindow(p, this.img, frameCount, this.seed + this.spawnIndex, this.dialogScale));
      this.spawnIndex++;
      p.randomSeed(this.seed);
    }

    for (const win of this.windows) {
      win.update(frameCount);
    }

    this.windows = this.windows.filter((w) => !w.isDead());
  }

  draw(frameCount: number): void {
    for (const win of this.windows) {
      win.draw(frameCount);
    }
  }

  hasActiveWindows(): boolean {
    return this.windows.length > 0;
  }
}

// ============================================================
// POST-PROCESSING EFFECTS
// ============================================================

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
