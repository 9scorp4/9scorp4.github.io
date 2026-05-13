/**
 * Digital rain (Matrix-style) effect for redflag.exe
 */

import { LOOP_FRAMES, type RainColumn, type P5Instance } from './types';

/**
 * Looping noise helper for seamless animation loops
 */
export function loopNoise(p: P5Instance, seed: number, radius: number, frameCount: number): number {
  const angle = (frameCount / LOOP_FRAMES) * Math.PI * 2;
  return p.noise(seed + Math.cos(angle) * radius, seed + Math.sin(angle) * radius);
}

/**
 * Digital rain column system - renders Matrix-style falling characters
 */
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
