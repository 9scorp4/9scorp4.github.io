#!/usr/bin/env npx tsx
/**
 * Generate Instagram profile picture for @jardincibernetico.
 * 400×400 PNG with paper background and centered sun mandala.
 *
 * Usage:
 *   npx tsx scripts/generate-profile-pic.ts
 *
 * Output: insta-output/profile-jardincibernetico.png
 */

import React from 'react';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFonts, generatePng } from '../src/lib/shared-image-utils.ts';
import { colors } from '../src/lib/insta-templates.tsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'insta-output');

const PROFILE_SIZE = 400;
const MANDALA_SIZE = 300;

/**
 * Sun mandala SVG for profile picture.
 * Matches the SunMandala from insta-templates but as a standalone component.
 */
function ProfileMandala({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const seedRadius = size * 0.08;
  const rayLength = size * 0.12;
  const dotRadius = size * 0.025;

  const rays: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * (outerRadius + 4);
    const y1 = cy + Math.sin(angle) * (outerRadius + 4);
    const x2 = cx + Math.cos(angle) * (outerRadius + rayLength);
    const y2 = cy + Math.sin(angle) * (outerRadius + rayLength);
    rays.push(
      React.createElement('line', {
        key: `ray-${i}`,
        x1,
        y1,
        x2,
        y2,
        stroke: colors.sun,
        strokeWidth: '2.5',
      })
    );
  }

  const dots: React.ReactNode[] = [];
  const cardinalAngles = [0, 90, 180, 270];
  for (const deg of cardinalAngles) {
    const angle = (deg * Math.PI) / 180;
    const x = cx + Math.cos(angle) * (outerRadius + rayLength + 8);
    const y = cy + Math.sin(angle) * (outerRadius + rayLength + 8);
    dots.push(
      React.createElement('circle', {
        key: `dot-${deg}`,
        cx: x,
        cy: y,
        r: dotRadius,
        fill: colors.sun,
      })
    );
  }

  const starPoints1 = [0, 120, 240].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * innerRadius},${cy + Math.sin(angle) * innerRadius}`;
  }).join(' ');

  const starPoints2 = [60, 180, 300].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * innerRadius},${cy + Math.sin(angle) * innerRadius}`;
  }).join(' ');

  return React.createElement(
    'svg',
    { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
    React.createElement('circle', {
      cx,
      cy,
      r: outerRadius,
      fill: 'none',
      stroke: colors.sun,
      strokeWidth: '2.5',
    }),
    ...rays,
    ...dots,
    React.createElement('polygon', {
      points: starPoints1,
      fill: 'none',
      stroke: colors.sun,
      strokeWidth: '2',
    }),
    React.createElement('polygon', {
      points: starPoints2,
      fill: 'none',
      stroke: colors.sun,
      strokeWidth: '2',
    }),
    React.createElement('circle', {
      cx,
      cy,
      r: seedRadius,
      fill: colors.sun,
    })
  );
}

/**
 * Profile picture template: paper background with centered mandala.
 */
function ProfileTemplate() {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        backgroundColor: colors.paper,
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    React.createElement(ProfileMandala, { size: MANDALA_SIZE })
  );
}

async function main() {
  console.log('\n  ✦ generating profile picture\n');

  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log('  loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  console.log('  rendering...');
  const element = ProfileTemplate();
  const png = await generatePng(element, fonts, {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
  });

  const outputPath = join(OUTPUT_DIR, 'profile-jardincibernetico.png');
  await writeFile(outputPath, png);

  console.log(`  ✓ saved: ${outputPath}\n`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
