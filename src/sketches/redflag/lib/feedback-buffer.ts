/**
 * Feedback buffer for trail/decay effects in redflag.exe
 */

import type p5 from 'p5';
import type { P5Instance } from './types';

/**
 * Creates a feedback/trail effect by blending previous frames
 */
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
