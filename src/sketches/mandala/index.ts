import p5 from 'p5';

const SUN_COLOR = '#c93f7a';
const CANVAS_SIZE = 80;
const FRAME_RATE = 15;

// Golden ratio proportions (base unit = 37px outer radius)
const OUTER_RADIUS = 37;
const DIAMOND_RADIUS = 35;
const RAY_INNER = 23;
const RAY_OUTER = 29;
const PETAL_INNER = 12;
const PETAL_OUTER = 18;
const STAR_RADIUS = 14;
const SEED_RADIUS = 2.25;

// Animation speeds (radians per frame)
const HEXAGON_SPEED = 0.012;
const PETAL_SPEED = 0.005;
const BREATH_PERIOD = 3; // seconds
const RAY_OSCILLATION_PERIOD = 20; // seconds
const RAY_OSCILLATION_AMPLITUDE = Math.PI / 12; // 15 degrees

function mandalaSketch(p: p5) {
  let hexagonAngle = 0;
  let petalAngle = 0;
  let breathPhase = 0;
  let rayOscillationPhase = 0;
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

  // Draw a single bezier petal (teardrop shape)
  const drawPetal = (angle: number, innerR: number, outerR: number) => {
    const petalWidth = 3; // half-width at bulge point
    const bulgePoint = 0.6; // where the bulge is (0-1)

    // Inner point (tip)
    const innerX = p.cos(angle) * innerR;
    const innerY = p.sin(angle) * innerR;

    // Outer point (tip)
    const outerX = p.cos(angle) * outerR;
    const outerY = p.sin(angle) * outerR;

    // Bulge radius
    const bulgeR = innerR + (outerR - innerR) * bulgePoint;

    // Perpendicular direction for bulge
    const perpX = -p.sin(angle);
    const perpY = p.cos(angle);

    // Control points for the curves
    const bulgeLeftX = p.cos(angle) * bulgeR + perpX * petalWidth;
    const bulgeLeftY = p.sin(angle) * bulgeR + perpY * petalWidth;
    const bulgeRightX = p.cos(angle) * bulgeR - perpX * petalWidth;
    const bulgeRightY = p.sin(angle) * bulgeR - perpY * petalWidth;

    // p5 2.0 takes one control point per bezierVertex() call, three per cubic
    // segment (bezierOrder defaults to 3), rather than all six coordinates at once.
    p.beginShape();
    p.vertex(innerX, innerY);
    p.bezierVertex(innerX + perpX * 1.5, innerY + perpY * 1.5);
    p.bezierVertex(bulgeLeftX, bulgeLeftY);
    p.bezierVertex(outerX, outerY);
    p.bezierVertex(bulgeRightX, bulgeRightY);
    p.bezierVertex(innerX - perpX * 1.5, innerY - perpY * 1.5);
    p.bezierVertex(innerX, innerY);
    p.endShape();
  };

  // Draw a diamond shape at given position
  const drawDiamond = (x: number, y: number, size: number) => {
    p.beginShape();
    p.vertex(x, y - size);
    p.vertex(x + size, y);
    p.vertex(x, y + size);
    p.vertex(x - size, y);
    p.endShape(p.CLOSE);
  };

  // Draw a tapered ray (triangle)
  const drawTaperedRay = (angle: number, innerR: number, outerR: number, innerWidth: number, outerWidth: number) => {
    const perpX = -p.sin(angle);
    const perpY = p.cos(angle);

    const innerX = p.cos(angle) * innerR;
    const innerY = p.sin(angle) * innerR;
    const outerX = p.cos(angle) * outerR;
    const outerY = p.sin(angle) * outerR;

    p.beginShape();
    p.vertex(innerX + perpX * innerWidth, innerY + perpY * innerWidth);
    p.vertex(outerX + perpX * outerWidth, outerY + perpY * outerWidth);
    p.vertex(outerX - perpX * outerWidth, outerY - perpY * outerWidth);
    p.vertex(innerX - perpX * innerWidth, innerY - perpY * innerWidth);
    p.endShape(p.CLOSE);
  };

  p.draw = () => {
    p.clear();
    p.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    p.stroke(SUN_COLOR);
    p.noFill();

    // Update animation state (skip if reduced motion)
    if (!reducedMotion) {
      hexagonAngle += HEXAGON_SPEED;
      petalAngle -= PETAL_SPEED; // counter-clockwise
      breathPhase += p.TWO_PI / (BREATH_PERIOD * FRAME_RATE);
      rayOscillationPhase += p.TWO_PI / (RAY_OSCILLATION_PERIOD * FRAME_RATE);
    }

    // Breathing scale for rays: 95% to 105% (reduced from ±10%)
    const breathScale = 1 + 0.05 * p.sin(breathPhase);

    // Ray rotation oscillation: ±15 degrees over 20s
    const rayRotation = RAY_OSCILLATION_AMPLITUDE * p.sin(rayOscillationPhase);

    // Petal pulse: 95% to 105%
    const petalPulse = 1 + 0.05 * p.sin(breathPhase * 1.3);

    // 1. Outer containing circle (static)
    p.strokeWeight(1.0);
    p.ellipse(0, 0, OUTER_RADIUS * 2, OUTER_RADIUS * 2);

    // 2. Cardinal diamonds at N, E, S, W
    p.strokeWeight(0.8);
    p.fill(SUN_COLOR);
    const diamondSize = 2;
    for (let i = 0; i < 4; i++) {
      const a = (p.TWO_PI / 4) * i - p.HALF_PI;
      const x = p.cos(a) * DIAMOND_RADIUS;
      const y = p.sin(a) * DIAMOND_RADIUS;
      drawDiamond(x, y, diamondSize);
    }
    p.noFill();

    // 3. Radiating rays (12 tapered triangles with breathing and slow oscillation)
    p.push();
    p.rotate(rayRotation);
    const rayCount = 12;
    const currentRayOuter = RAY_OUTER * breathScale;
    for (let i = 0; i < rayCount; i++) {
      const a = (p.TWO_PI / rayCount) * i;
      // Tapered stroke: thicker at inner (0.6), thinner at outer (0.3)
      // Draw as filled shape to achieve taper effect
      p.fill(SUN_COLOR);
      p.noStroke();
      drawTaperedRay(a, RAY_INNER, currentRayOuter, 0.8, 0.3);
    }
    p.stroke(SUN_COLOR);
    p.noFill();
    p.pop();

    // 4. Petal corona (6 bezier petals, counter-rotate with pulse)
    p.push();
    p.rotate(petalAngle);
    p.strokeWeight(0.8);
    const currentPetalOuter = PETAL_OUTER * petalPulse;
    for (let i = 0; i < 6; i++) {
      const a = (p.TWO_PI / 6) * i;
      drawPetal(a, PETAL_INNER, currentPetalOuter);
    }
    p.pop();

    // 5. Inner hexagon / 6-pointed star (two overlapping triangles, rotate)
    p.push();
    p.rotate(hexagonAngle);
    p.strokeWeight(1.2);

    // First triangle (pointing up)
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const a = (p.TWO_PI / 3) * i - p.HALF_PI;
      p.vertex(p.cos(a) * STAR_RADIUS, p.sin(a) * STAR_RADIUS);
    }
    p.endShape(p.CLOSE);

    // Second triangle (pointing down, offset by 60°)
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const a = (p.TWO_PI / 3) * i + p.HALF_PI;
      p.vertex(p.cos(a) * STAR_RADIUS, p.sin(a) * STAR_RADIUS);
    }
    p.endShape(p.CLOSE);
    p.pop();

    // 6. Central seed (larger filled circle)
    p.fill(SUN_COLOR);
    p.noStroke();
    p.ellipse(0, 0, SEED_RADIUS * 2, SEED_RADIUS * 2);
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
