/**
 * Type definitions for redflag.exe sketch utilities
 */

import type p5 from 'p5';

// ============================================================
// CONSTANTS
// ============================================================

export const LOOP_FRAMES = 180; // 12 seconds at 15fps
export const BPM = 128;
export const FRAMES_PER_BEAT = Math.round((60 / BPM) * 15); // ~7 frames at 15fps
export const LOOP_FRAMES_PER_BEAT = 6; // for perfect loop alignment
export const BEATS_PER_LOOP = LOOP_FRAMES / LOOP_FRAMES_PER_BEAT; // 30 beats

export const COLORS = {
  background: [5, 5, 5] as const,
  rainGreen: '#00ff41',
  rainDark: '#003300',
  rainHead: '#ffffff',
  strobeYellow: '#fae30c',
  strobeMagenta: '#b814cc',
  strobeCyan: '#00e5ff',
} as const;

// Window timing
export const WINDOW_DEADLINE = 150;
export const DEATH_START = 150;
export const DEATH_PEAK = 165;
export const DEATH_END = 180;

// ============================================================
// INTERFACES
// ============================================================

export interface RainColumn {
  x: number;
  speed: number;
  offset: number;
  active: boolean;
  chars: string[];
  noiseSeed: number;
}

export interface DissolveSlice {
  maxOffset: number;
  delay: number;
}

export const enum WindowState {
  POP_IN = 'pop_in',
  CHAOS = 'chaos',
  DISSOLVE = 'dissolve',
  DEAD = 'dead',
}

export interface SketchOptions {
  width: number;
  height: number;
  reducedMotion?: boolean;
  seed?: number;
}

export interface SketchInstance {
  remove: () => void;
}

export type P5Instance = p5;
