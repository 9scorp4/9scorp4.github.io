#!/usr/bin/env npx tsx
/**
 * Generate "Welcome to the Garden" Instagram carousel.
 * 10 slides introducing el jardín cibernético.
 *
 * Usage:
 *   npx tsx scripts/generate-intro-carousel.ts
 *
 * Output: insta-output/intro-{01-10}.png
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import {
  loadFonts,
  generatePng,
} from '../src/lib/shared-image-utils.ts';
import {
  IntroSlideTemplate,
  INSTA_DIMENSIONS,
  colors,
} from '../src/lib/insta-templates.tsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'insta-output');

// ─────────────────────────────────────────────────────────────
// Slide definitions
// ─────────────────────────────────────────────────────────────

interface SlideConfig {
  headline: string;
  subtext?: string;
  showMandala?: boolean;
  showSunAccent?: boolean;
  monospace?: boolean;
  customVisual?: React.ReactNode;
  showSiteFooter?: boolean;
  siteUrl?: string;
}

/**
 * SVG status icon for cultivation states.
 * Matches the StatusIcon in insta-templates.tsx but sized for carousel.
 */
function StatusSvg({ status, color, size = 48 }: { status: string; color: string; size?: number }) {
  const stroke = 3;

  switch (status) {
    case 'growing':
      // Up-pointing triangle
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <polygon
            points="24,6 44,40 4,40"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'dormant':
      // Circle with left half filled
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="18" fill="none" stroke={color} strokeWidth={stroke} />
          <path d="M24,6 A18,18 0 0,0 24,42 Z" fill={color} />
        </svg>
      );
    case 'wild':
      // Empty circle
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="18" fill="none" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case 'composted':
      // X mark
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <line x1="10" y1="10" x2="38" y2="38" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <line x1="38" y1="10" x2="10" y2="38" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Status symbols visual for slide 5.
 * Renders the cultivation status legend with SVG icons.
 */
function StatusSymbols() {
  const statuses = [
    { status: 'growing', label: 'growing', color: colors.fern },
    { status: 'dormant', label: 'dormant', color: colors.ochre },
    { status: 'wild', label: 'wild', color: colors.inkSoft },
    { status: 'composted', label: 'composted', color: colors.inkFaint },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '48px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {statuses.map(({ status, label, color }) => (
        <div key={label} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <StatusSvg status={status} color={color} size={48} />
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkFaint,
            letterSpacing: '0.1em',
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Prompt glyph for visitors' book slide.
 */
function PromptGlyph() {
  return (
    <div style={{
      display: 'flex',
      fontFamily: 'monospace',
      fontSize: '72px',
      color: colors.sun,
    }}>
      {'>'}
    </div>
  );
}

/**
 * Library names in smaller type.
 */
function LibraryNames() {
  const names = ['bateson', 'beer', 'maturana', 'pask', 'wiener', 'von foerster'];
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{
        display: 'flex',
        fontFamily: 'IM Fell DW Pica',
        fontSize: '22px',
        color: colors.inkSoft,
        fontStyle: 'italic',
        letterSpacing: '0.05em',
      }}>
        {names.join(' / ')}
      </div>
    </div>
  );
}

const slides: SlideConfig[] = [
  // Slide 1 -Title
  {
    headline: 'el jardín cibernético',
    subtext: 'a garden that documents itself',
    showMandala: true,
  },
  // Slide 2 -el ahora
  {
    headline: 'el ahora',
    subtext: "what's happening now, updated whenever",
    showSunAccent: true,
  },
  // Slide 3 -conservatory
  {
    headline: 'el invernadero',
    subtext: 'generative sketches, numbered like specimens',
    showSunAccent: true,
  },
  // Slide 4 -field journal
  {
    headline: 'cuaderno de campo',
    subtext: 'long-form notes, some answer themselves back',
    showSunAccent: true,
  },
  // Slide 5 -cultivations
  {
    headline: 'los cultivos',
    subtext: 'projects in various states',
    customVisual: React.createElement(StatusSymbols),
  },
  // Slide 6 -library
  {
    headline: 'la biblioteca',
    customVisual: React.createElement(LibraryNames),
    showSunAccent: true,
  },
  // Slide 7 -visitors' book
  {
    headline: 'libro de visitas',
    subtext: 'leave a note, or type something unexpected',
    customVisual: React.createElement(PromptGlyph),
  },
  // Slide 8 -secrets
  {
    headline: 'there are secrets in the root system',
    subtext: '8 hidden. more to come.',
    showSunAccent: true,
  },
  // Slide 9 -devtools
  {
    headline: 'open devtools sometime',
    subtext: 'try window.garden',
    monospace: true,
    showSunAccent: true,
  },
  // Slide 10 -closing
  {
    headline: 'like a garden, it grows',
    showMandala: true,
    siteUrl: '9scorp4.github.io',
    showSiteFooter: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Main generation
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n  ✦ generating intro carousel\n');

  // Ensure output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Load fonts
  console.log('  loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  const dimensions = INSTA_DIMENSIONS.square;
  const format = 'square' as const;

  // Generate each slide
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideNum = String(i + 1).padStart(2, '0');
    const filename = `intro-${slideNum}.png`;

    const element = IntroSlideTemplate({
      headline: slide.headline,
      subtext: slide.subtext,
      showMandala: slide.showMandala,
      showSunAccent: slide.showSunAccent,
      monospace: slide.monospace,
      customVisual: slide.customVisual,
      showSiteFooter: slide.showSiteFooter,
      siteUrl: slide.siteUrl,
      format,
    });

    const png = await generatePng(element, fonts, dimensions);
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, png);
    console.log(`  [${slideNum}] ${filename} -"${slide.headline}"`);
  }

  console.log(`\n  ✓ generated ${slides.length} slides to ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
