/**
 * Dialog window system for redflag.exe - chaotic popup windows
 */

import type p5 from 'p5';
import {
  WINDOW_DEADLINE,
  LOOP_FRAMES_PER_BEAT,
  WindowState,
  type DissolveSlice,
  type P5Instance,
} from './types';
import { easeOutBack, easeOutQuad, easeInQuad } from './easing';

/**
 * A single dialog window that pops in, teleports chaotically, then dissolves
 */
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

/**
 * Manages spawning and lifecycle of multiple dialog windows
 */
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
      this.windows.push(
        new DialogWindow(p, this.img, frameCount, this.seed + this.spawnIndex, this.dialogScale)
      );
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
