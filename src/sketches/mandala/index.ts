import p5 from 'p5';

const SUN_COLOR = '#c93f7a';
const CANVAS_SIZE = 80;
const FRAME_RATE = 15;

// Animation speeds (radians per frame)
const HEXAGON_SPEED = 0.012;
const VESICA_SPEED = 0.008;
const BREATH_PERIOD = 3; // seconds

function mandalaSketch(p: p5) {
  let hexagonAngle = 0;
  let vesicaAngle = 0;
  let breathPhase = 0;
  let observer: IntersectionObserver | null = null;
  let isVisible = true;
  let reducedMotion = false;

  p.setup = () => {
    const container = document.getElementById('mandala-canvas');
    if (!container) return;

    const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.parent(container);
    p.frameRate(FRAME_RATE);

    // Check for reduced motion preference
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pause when offscreen
    observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !reducedMotion) {
          p.loop();
        } else {
          p.noLoop();
        }
      },
      { threshold: 0.1 }
    );

    if (container) {
      observer.observe(container);
    }

    // If reduced motion, draw once and stop
    if (reducedMotion) {
      p.noLoop();
    }
  };

  p.draw = () => {
    p.clear();
    p.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    p.stroke(SUN_COLOR);
    p.noFill();

    // Update animation state (skip if reduced motion)
    if (!reducedMotion) {
      hexagonAngle += HEXAGON_SPEED;
      vesicaAngle -= VESICA_SPEED; // counter-clockwise
      breathPhase += p.TWO_PI / (BREATH_PERIOD * FRAME_RATE);
    }

    // Breathing scale for rays: 90% to 110%
    const breathScale = 1 + 0.1 * p.sin(breathPhase);

    // 1. Outer containing circle + cardinal dots (static)
    p.strokeWeight(0.8);
    p.ellipse(0, 0, 74, 74);

    // Cardinal dots (4 points at N, E, S, W)
    p.strokeWeight(3);
    for (let i = 0; i < 4; i++) {
      const a = (p.TWO_PI / 4) * i - p.HALF_PI; // start at top
      const x = p.cos(a) * 37;
      const y = p.sin(a) * 37;
      p.point(x, y);
    }

    // 2. Radiating rays (12 thin lines with breathing)
    p.strokeWeight(0.6);
    const rayCount = 12;
    const rayInner = 18;
    const rayOuter = 32 * breathScale;
    for (let i = 0; i < rayCount; i++) {
      const a = (p.TWO_PI / rayCount) * i;
      const x1 = p.cos(a) * rayInner;
      const y1 = p.sin(a) * rayInner;
      const x2 = p.cos(a) * rayOuter;
      const y2 = p.sin(a) * rayOuter;
      p.line(x1, y1, x2, y2);
    }

    // 3. Vesica piscis ring (6 overlapping circles, counter-rotate)
    p.push();
    p.rotate(vesicaAngle);
    p.strokeWeight(0.7);
    const vesicaRadius = 10;
    const vesicaOffset = 8;
    for (let i = 0; i < 6; i++) {
      const a = (p.TWO_PI / 6) * i;
      const cx = p.cos(a) * vesicaOffset;
      const cy = p.sin(a) * vesicaOffset;
      p.ellipse(cx, cy, vesicaRadius * 2, vesicaRadius * 2);
    }
    p.pop();

    // 4. Inner hexagon / 6-pointed star (two overlapping triangles, rotate)
    p.push();
    p.rotate(hexagonAngle);
    p.strokeWeight(1);
    const starRadius = 14;

    // First triangle (pointing up)
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const a = (p.TWO_PI / 3) * i - p.HALF_PI;
      p.vertex(p.cos(a) * starRadius, p.sin(a) * starRadius);
    }
    p.endShape(p.CLOSE);

    // Second triangle (pointing down, offset by 60°)
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const a = (p.TWO_PI / 3) * i + p.HALF_PI;
      p.vertex(p.cos(a) * starRadius, p.sin(a) * starRadius);
    }
    p.endShape(p.CLOSE);
    p.pop();

    // 5. Central seed (small filled circle)
    p.fill(SUN_COLOR);
    p.noStroke();
    p.ellipse(0, 0, 5, 5);
  };
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  const init = () => {
    const container = document.getElementById('mandala-canvas');
    if (container && !container.hasChildNodes()) {
      new p5(mandalaSketch);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
