#!/usr/bin/env npx tsx
/**
 * Interactive CLI for generating Instagram-ready images from site content.
 * Uses the same Satori + Resvg pipeline as OG images.
 *
 * Usage:
 *   npm run insta                        # Interactive mode
 *   npm run insta -- --publish           # Generate and schedule to Buffer
 *   npx tsx scripts/insta-gen.ts --help  # Show help
 *
 * Output: Images saved to ./insta-output/{type}-{slug}.png
 */

import 'dotenv/config';
import { select, confirm, input } from '@inquirer/prompts';
import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as yaml from 'yaml';
import {
  loadFonts,
  generatePng,
} from '../src/lib/shared-image-utils.ts';
import {
  QuoteTemplate,
  TitleTemplate,
  StatusTemplate,
  SpecimenTemplate,
  IntroSlideTemplate,
  INSTA_DIMENSIONS,
  colors,
  type InstaFormat,
} from '../src/lib/insta-templates.tsx';
import {
  generateCaption,
  createPostMetadata,
  type TemplateType,
  type ContentMetadata,
  type QuoteMetadata,
  type TitleMetadata,
  type StatusMetadata,
  type SpecimenMetadata,
  type IntroMetadata,
  type SavedPostMetadata,
} from '../src/lib/insta-captions.ts';
import {
  generateQRDataUrl,
  getContentUrl,
  type ExtendedQuoteMetadata,
  type ExtendedTitleMetadata,
  type ExtendedSpecimenMetadata,
} from '../src/lib/qr-utils.ts';
import { uploadToR2 } from '../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createPost,
  createCarouselPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../src/lib/buffer-client.ts';
import React from 'react';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const SRC_DIR = join(PROJECT_ROOT, 'src');
const OUTPUT_DIR = join(PROJECT_ROOT, 'insta-output');

/** Minimum chars for a paragraph to be quote-worthy (filters captions, stubs). */
const MIN_PARAGRAPH_LENGTH = 50;

/** Max chars in CLI paragraph picker (keeps menu scannable). */
const CLI_TRUNCATE_LENGTH = 80;

// ─────────────────────────────────────────────────────────────
// Content loading utilities
// ─────────────────────────────────────────────────────────────

interface JournalEntry {
  slug: string;
  title: string;
  titleSecondary?: string;
  date: Date;
  type: 'article' | 'diptych';
  draft: boolean;
}

interface AhoraEntry {
  date: Date;
  temperatura?: string;
  escuchando?: string;
  cultivando?: string;
  body: string;
}

interface Specimen {
  id: string;
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  description: string;
  series?: string;
  seriesIndex?: number;
}

/**
 * Parse YAML frontmatter from markdown content.
 * Matches content between opening and closing `---` delimiters.
 * @returns Parsed frontmatter object, or empty object if none found.
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return yaml.parse(match[1]) as Record<string, unknown>;
}

/**
 * Extract the body content after frontmatter.
 * Strips the YAML frontmatter block and returns the trimmed remainder.
 * @returns Body content, or empty string if no frontmatter delimiter found.
 */
function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

/**
 * Strip markdown formatting from text.
 * Removes: **bold**, *italic*, [links](url), `code`
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.+?)\*/g, '$1')       // *italic*
    .replace(/_(.+?)_/g, '$1')         // _italic_
    .replace(/`(.+?)`/g, '$1')         // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url)
}

/**
 * Extract paragraphs from markdown body for quote browser.
 * Splits on double newlines, joins single newlines into spaces.
 * Strips markdown formatting for clean display.
 * Filters out:
 * - Empty paragraphs
 * - Horizontal rules (`---`)
 * - Paragraphs shorter than MIN_PARAGRAPH_LENGTH
 * - Headings (lines starting with `#`)
 */
function extractParagraphs(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map(p => stripMarkdown(p.replace(/\n/g, ' ').trim()))
    .filter(p => {
      if (!p || p === '---') return false;
      if (p.length < MIN_PARAGRAPH_LENGTH) return false;
      if (p.startsWith('#')) return false;
      return true;
    });
}

/**
 * Load all non-draft journal entries from src/content/journal.
 * Each entry is a directory with an index.md containing frontmatter.
 * @returns Entries sorted by date descending.
 */
async function loadJournalEntries(): Promise<JournalEntry[]> {
  const journalDir = join(SRC_DIR, 'content', 'journal');
  const entries: JournalEntry[] = [];
  const items = await readdir(journalDir);

  for (const item of items) {
    const itemPath = join(journalDir, item);
    const itemStat = await stat(itemPath);

    if (itemStat.isDirectory()) {
      const indexPath = join(itemPath, 'index.md');
      try {
        const content = await readFile(indexPath, 'utf-8');
        const fm = parseFrontmatter(content);

        if (!fm.draft) {
          entries.push({
            slug: item,
            title: fm.title as string,
            titleSecondary: fm.title_secondary as string | undefined,
            date: parseLocalDate(fm.date as string),
            type: (fm.type as 'article' | 'diptych') || 'article',
            draft: false,
          });
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
        console.warn(`  Warning: Could not read ${itemPath}: ${(err as Error).message}`);
      }
    }
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Load the body content for a journal entry.
 * For diptychs, reads _article.md; otherwise extracts body from index.md.
 */
async function loadJournalBody(slug: string): Promise<string> {
  const articlePath = join(SRC_DIR, 'content', 'journal', slug, '_article.md');
  try {
    return await readFile(articlePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // Not a diptych — read from index.md instead
      const indexPath = join(SRC_DIR, 'content', 'journal', slug, 'index.md');
      const content = await readFile(indexPath, 'utf-8');
      return extractBody(content);
    }
    throw err;
  }
}

/**
 * Format escuchando from frontmatter structure.
 * Handles array of { artist, title } objects → "Artist — Title"
 */
function formatEscuchando(fm: Record<string, unknown>): string | undefined {
  const esc = fm.escuchando;
  if (!esc) return undefined;

  // Array of tracks: [{ artist, title }, ...]
  if (Array.isArray(esc) && esc.length > 0) {
    const track = esc[0] as { artist?: string; title?: string };
    if (track.artist && track.title) {
      return `${track.artist} — ${track.title}`;
    }
  }

  // Simple string
  if (typeof esc === 'string') {
    return esc;
  }

  return undefined;
}

/**
 * Load all ahora dispatches from src/content/ahora.
 * Parses fields from both frontmatter (escuchando) and body (temperatura, cultivando).
 * @returns Entries sorted by date descending.
 */
async function loadAhoraEntries(): Promise<AhoraEntry[]> {
  const ahoraDir = join(SRC_DIR, 'content', 'ahora');
  const entries: AhoraEntry[] = [];
  const files = await readdir(ahoraDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(join(ahoraDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const body = extractBody(content);

    // Parse body fields (temperatura, cultivando)
    const temperatura = body.match(/\*temperatura:\*\s*(.+)/i)?.[1]?.trim();
    // Look for creciendo OR cultivando
    const cultivando =
      body.match(/\*creciendo:\*\s*(.+)/i)?.[1]?.trim() ||
      body.match(/\*cultivando:\*\s*(.+)/i)?.[1]?.trim();

    // escuchando: try frontmatter first, fall back to body
    const escuchando =
      formatEscuchando(fm) ||
      body.match(/\*escuchando:\*\s*(.+)/i)?.[1]?.trim();

    entries.push({
      date: parseLocalDate(fm.date as string),
      temperatura,
      escuchando,
      cultivando,
      body,
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Load all specimen metadata from src/content/specimens.
 * Each specimen is a YAML file with id, name, status, description.
 */
async function loadSpecimens(): Promise<Specimen[]> {
  const specDir = join(SRC_DIR, 'content', 'specimens');
  const specimens: Specimen[] = [];
  const files = await readdir(specDir);

  for (const file of files) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    const content = await readFile(join(specDir, file), 'utf-8');
    const data = yaml.parse(content) as Specimen;
    specimens.push(data);
  }

  return specimens;
}

// ─────────────────────────────────────────────────────────────
// Intro carousel slide definitions
// ─────────────────────────────────────────────────────────────

interface IntroSlideConfig {
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
 */
function StatusSvg({ status, color, size = 48 }: { status: string; color: string; size?: number }) {
  const stroke = 3;

  switch (status) {
    case 'growing':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('polygon', {
          points: '24,6 44,40 4,40',
          fill: 'none',
          stroke: color,
          strokeWidth: stroke,
          strokeLinejoin: 'round',
        })
      );
    case 'dormant':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('circle', { cx: 24, cy: 24, r: 18, fill: 'none', stroke: color, strokeWidth: stroke }),
        React.createElement('path', { d: 'M24,6 A18,18 0 0,0 24,42 Z', fill: color })
      );
    case 'wild':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('circle', { cx: 24, cy: 24, r: 18, fill: 'none', stroke: color, strokeWidth: stroke })
      );
    case 'composted':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('line', { x1: 10, y1: 10, x2: 38, y2: 38, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' }),
        React.createElement('line', { x1: 38, y1: 10, x2: 10, y2: 38, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' })
      );
    default:
      return null;
  }
}

/**
 * Status symbols visual for intro slide 5.
 */
function StatusSymbols() {
  const statuses = [
    { status: 'growing', label: 'growing', color: colors.fern },
    { status: 'dormant', label: 'dormant', color: colors.ochre },
    { status: 'wild', label: 'wild', color: colors.inkSoft },
    { status: 'composted', label: 'composted', color: colors.inkFaint },
  ];

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: '48px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  }, statuses.map(({ status, label, color }) =>
    React.createElement('div', {
      key: label,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      },
    },
      React.createElement(StatusSvg, { status, color, size: 48 }),
      React.createElement('div', {
        style: {
          display: 'flex',
          fontFamily: 'IM Fell DW Pica',
          fontSize: '18px',
          color: colors.inkFaint,
          letterSpacing: '0.1em',
        },
      }, label)
    )
  ));
}

/**
 * Prompt glyph for visitors' book slide.
 */
function PromptGlyph() {
  return React.createElement('div', {
    style: {
      display: 'flex',
      fontFamily: 'monospace',
      fontSize: '72px',
      color: colors.sun,
    },
  }, '>');
}

/**
 * Library names for slide 6.
 */
function LibraryNames() {
  const names = ['bateson', 'beer', 'maturana', 'pask', 'wiener', 'von foerster'];
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    },
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        fontFamily: 'IM Fell DW Pica',
        fontSize: '22px',
        color: colors.inkSoft,
        fontStyle: 'italic',
        letterSpacing: '0.05em',
      },
    }, names.join(' / '))
  );
}

/**
 * Get intro carousel slide configurations.
 */
function getIntroSlides(): IntroSlideConfig[] {
  return [
    {
      headline: 'el jardin cibernetico',
      subtext: 'a garden that documents itself',
      showMandala: true,
    },
    {
      headline: 'el ahora',
      subtext: "what's happening now, updated whenever",
      showSunAccent: true,
    },
    {
      headline: 'el invernadero',
      subtext: 'generative sketches, numbered like specimens',
      showSunAccent: true,
    },
    {
      headline: 'cuaderno de campo',
      subtext: 'long-form notes, some answer themselves back',
      showSunAccent: true,
    },
    {
      headline: 'los cultivos',
      subtext: 'projects in various states',
      customVisual: React.createElement(StatusSymbols),
    },
    {
      headline: 'la biblioteca',
      customVisual: React.createElement(LibraryNames),
      showSunAccent: true,
    },
    {
      headline: 'libro de visitas',
      subtext: 'leave a note, or type something unexpected',
      customVisual: React.createElement(PromptGlyph),
    },
    {
      headline: 'there are secrets in the root system',
      subtext: '8 hidden. more to come.',
      showSunAccent: true,
    },
    {
      headline: 'open devtools sometime',
      subtext: 'try window.garden',
      monospace: true,
      showSunAccent: true,
    },
    {
      headline: 'like a garden, it grows',
      showMandala: true,
      siteUrl: '9scorp4.github.io',
      showSiteFooter: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// CLI utilities
// ─────────────────────────────────────────────────────────────

/**
 * Truncate a string to a maximum length, adding ellipsis if needed.
 */
function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

/**
 * Parse a date string as local time (avoids UTC timezone shift).
 * "2026-05-04" → May 4 in local timezone, not May 3.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date in en-US locale: "May 7, 2026".
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert a string to a URL-safe slug.
 * Lowercases, replaces non-alphanumeric runs with hyphens, trims edges.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Open an image file with the system's default viewer.
 * Cross-platform: uses `open` (macOS), `xdg-open` (Linux), `start` (Windows).
 */
async function openImage(path: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${path}"`);
    } else if (platform === 'linux') {
      execSync(`xdg-open "${path}"`);
    } else if (platform === 'win32') {
      execSync(`start "" "${path}"`);
    }
  } catch (err) {
    console.log(`  (Could not open: ${(err as Error).message}. File at: ${path})`);
  }
}

// ─────────────────────────────────────────────────────────────
// Publishing flow
// ─────────────────────────────────────────────────────────────

interface GeneratedPost {
  templateType: TemplateType;
  imagePath: string;
  metadata: ContentMetadata;
}

interface GeneratedCarousel {
  templateType: TemplateType;
  imagePaths: string[];
  metadata: ContentMetadata;
}

/**
 * Prompt for caption, hashtags, and scheduling, then publish to Buffer.
 */
async function publishToBuffer(post: GeneratedPost): Promise<void> {
  console.log('\n  ✦ publishing to buffer\n');

  // Check for required env vars
  let bufferConfig;
  try {
    bufferConfig = loadBufferConfig();
  } catch (err) {
    console.log(`  ${(err as Error).message}`);
    console.log('  Add BUFFER_API_KEY and BUFFER_CHANNEL_ID to .env to enable publishing.\n');
    return;
  }

  // Generate default caption and hashtags
  const defaults = generateCaption(post.templateType, post.metadata);

  // Prompt for caption
  const caption = await input({
    message: 'Caption:',
    default: defaults.caption,
  });

  // Prompt for hashtags (first comment)
  const hashtags = await input({
    message: 'Hashtags (first comment):',
    default: defaults.hashtags,
  });

  // Prompt for scheduling
  const scheduleOptions = getScheduleOptions();
  const scheduleChoice = await select<string>({
    message: 'When to publish? (America/Montreal)',
    choices: [
      ...scheduleOptions.map((opt) => ({
        value: opt.value ? opt.value.toISOString() : 'now',
        name: opt.label,
      })),
      { value: 'custom', name: 'Custom date/time...' },
      { value: 'skip', name: 'Skip publishing' },
    ],
  });

  if (scheduleChoice === 'skip') {
    console.log('  Skipped publishing.\n');
    return;
  }

  let scheduledAt: Date | undefined;
  if (scheduleChoice === 'custom') {
    const customTime = await input({
      message: 'Enter date/time (YYYY-MM-DD HH:MM):',
      default: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    scheduledAt = parseLocalTime(customTime);
  } else if (scheduleChoice !== 'now') {
    scheduledAt = new Date(scheduleChoice);
  }

  // Upload image to R2
  console.log('  Uploading image to R2...');
  let imageUrl: string;
  try {
    imageUrl = await uploadToR2(post.imagePath);
    console.log(`  Uploaded: ${imageUrl}`);
  } catch (err) {
    console.log(`  Failed to upload: ${(err as Error).message}`);
    console.log('  Check R2 environment variables in .env\n');
    return;
  }

  // Create post on Buffer
  console.log('  Scheduling post on Buffer...');
  try {
    const result = await createPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: caption,
      imageUrl,
      altText: `Instagram post: ${post.templateType}`,
      scheduledAt,
      firstComment: hashtags || undefined,
    });

    const timeStr = scheduledAt
      ? formatScheduledTime(scheduledAt)
      : 'added to queue';
    console.log(`  ✓ Scheduled! Post ID: ${result.id}`);
    console.log(`  Time: ${timeStr}\n`);

    // Save metadata alongside image
    const metadataPath = post.imagePath.replace(/\.png$/, '.json');
    const savedMeta: SavedPostMetadata = {
      ...createPostMetadata(post.templateType, post.metadata, caption, hashtags),
      published: true,
      publishedAt: new Date().toISOString(),
      bufferId: result.id,
    };
    await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
  } catch (err) {
    console.log(`  Failed to schedule: ${(err as Error).message}\n`);
  }
}

/**
 * Prompt for caption, hashtags, and scheduling, then publish carousel to Buffer.
 */
async function publishCarouselToBuffer(carousel: GeneratedCarousel): Promise<void> {
  console.log('\n  ✦ publishing carousel to buffer\n');
  console.log(`  ${carousel.imagePaths.length} images in carousel\n`);

  // Check for required env vars
  let bufferConfig;
  try {
    bufferConfig = loadBufferConfig();
  } catch (err) {
    console.log(`  ${(err as Error).message}`);
    console.log('  Add BUFFER_API_KEY and BUFFER_CHANNEL_ID to .env to enable publishing.\n');
    return;
  }

  // Generate default caption and hashtags
  const defaults = generateCaption(carousel.templateType, carousel.metadata);

  // Prompt for caption
  const caption = await input({
    message: 'Caption:',
    default: defaults.caption,
  });

  // Prompt for hashtags (first comment)
  const hashtags = await input({
    message: 'Hashtags (first comment):',
    default: defaults.hashtags,
  });

  // Prompt for scheduling
  const scheduleOptions = getScheduleOptions();
  const scheduleChoice = await select<string>({
    message: 'When to publish? (America/Montreal)',
    choices: [
      ...scheduleOptions.map((opt) => ({
        value: opt.value ? opt.value.toISOString() : 'now',
        name: opt.label,
      })),
      { value: 'custom', name: 'Custom date/time...' },
      { value: 'skip', name: 'Skip publishing' },
    ],
  });

  if (scheduleChoice === 'skip') {
    console.log('  Skipped publishing.\n');
    return;
  }

  let scheduledAt: Date | undefined;
  if (scheduleChoice === 'custom') {
    const customTime = await input({
      message: 'Enter date/time (YYYY-MM-DD HH:MM):',
      default: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    scheduledAt = parseLocalTime(customTime);
  } else if (scheduleChoice !== 'now') {
    scheduledAt = new Date(scheduleChoice);
  }

  // Upload all images to R2
  console.log('  Uploading images to R2...');
  const imageUrls: string[] = [];
  try {
    for (let i = 0; i < carousel.imagePaths.length; i++) {
      const imagePath = carousel.imagePaths[i];
      const url = await uploadToR2(imagePath);
      imageUrls.push(url);
      console.log(`  [${i + 1}/${carousel.imagePaths.length}] Uploaded`);
    }
  } catch (err) {
    console.log(`  Failed to upload: ${(err as Error).message}`);
    console.log('  Check R2 environment variables in .env\n');
    return;
  }

  // Create carousel post on Buffer
  console.log('  Scheduling carousel on Buffer...');
  try {
    const result = await createCarouselPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: caption,
      imageUrls,
      scheduledAt,
      firstComment: hashtags || undefined,
    });

    const timeStr = scheduledAt
      ? formatScheduledTime(scheduledAt)
      : 'added to queue';
    console.log(`  ✓ Scheduled! Post ID: ${result.id}`);
    console.log(`  Time: ${timeStr}\n`);

    // Save metadata alongside first image
    const metadataPath = carousel.imagePaths[0].replace(/\.png$/, '.json');
    const savedMeta: SavedPostMetadata = {
      ...createPostMetadata(carousel.templateType, carousel.metadata, caption, hashtags),
      published: true,
      publishedAt: new Date().toISOString(),
      bufferId: result.id,
    };
    await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
  } catch (err) {
    console.log(`  Failed to schedule: ${(err as Error).message}\n`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main CLI flow
// ─────────────────────────────────────────────────────────────

const publishMode = process.argv.includes('--publish') || process.argv.includes('-p');

/** Sentinel value for "go back" option */
const BACK = Symbol('back');

/** Add a back option to choices (except for first step) */
function withBack<T>(choices: Array<{ value: T; name: string }>, includeBack = true) {
  if (!includeBack) return choices;
  return [
    ...choices,
    { value: BACK as unknown as T, name: '← Back' },
  ];
}

async function main(): Promise<void> {
  console.log('\n  ✦ instagram content generator\n');

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Load fonts once
  console.log('  loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  let continueGenerating = true;

  while (continueGenerating) {
    // Step 1: Select template type
    let templateType: TemplateType | typeof BACK;
    let format: InstaFormat | typeof BACK;

    stepTemplate:
    while (true) {
      templateType = await select<TemplateType | typeof BACK>({
        message: 'What would you like to create?',
        choices: [
          { value: 'quote' as const, name: 'Quote card — excerpt from journal entry' },
          { value: 'title' as const, name: 'Title card — entry title + date + mandala' },
          { value: 'status' as const, name: 'Status update — ahora dispatch' },
          { value: 'specimen' as const, name: 'Specimen showcase — from conservatory' },
          { value: 'intro' as const, name: 'Intro carousel — welcome to the garden (10 slides)' },
        ],
      });

      // Step 2: Select format
      stepFormat:
      while (true) {
        format = await select<InstaFormat | typeof BACK>({
          message: 'Select format:',
          choices: withBack([
            { value: 'square' as const, name: 'Square (1080×1080)' },
            { value: 'portrait' as const, name: 'Portrait (1080×1350)' },
          ]),
        });

        if (format === BACK) continue stepTemplate;
        break stepFormat;
      }
      break stepTemplate;
    }

    // Step 3: Handle based on template type
    let outputPath: string;
    let generatedPost: GeneratedPost | undefined;
    let generatedCarousel: GeneratedCarousel | undefined;
    let shouldRestart = false;

    if (templateType === 'quote' || templateType === 'title') {
      // Load journal entries
      const entries = await loadJournalEntries();
      if (entries.length === 0) {
        console.log('  No journal entries found.\n');
        continue;
      }

      const entryOrBack = await select<JournalEntry | typeof BACK>({
        message: 'Select journal entry:',
        choices: withBack(entries.map((e) => ({
          value: e,
          name: `${e.title} (${formatDate(e.date)})${e.type === 'diptych' ? ' ⁂' : ''}`,
        }))),
      });

      if (entryOrBack === BACK) continue;
      const entry = entryOrBack as JournalEntry;

      if (templateType === 'quote') {
        // Load body and extract paragraphs
        const body = await loadJournalBody(entry.slug);
        const paragraphs = extractParagraphs(body);

        if (paragraphs.length === 0) {
          console.log('  No paragraphs found in this entry.\n');
          continue;
        }

        const paragraphOrBack = await select<string | typeof BACK>({
          message: 'Select paragraph to quote:',
          choices: withBack(paragraphs.map((p, i) => ({
            value: p,
            name: `[${i + 1}] ${truncate(p, CLI_TRUNCATE_LENGTH)}`,
          }))),
        });

        if (paragraphOrBack === BACK) continue;
        const paragraph = paragraphOrBack as string;

        // Check for carousel mode
        const isCarousel = await confirm({
          message: 'Generate as carousel? (split into multiple slides)',
          default: false,
        });

        if (isCarousel) {
          // Split quote for carousel
          const slideCount = await select<number>({
            message: 'Number of slides:',
            choices: [2, 3, 4, 5].map(n => ({ value: n, name: `${n} slides` })),
          });

          // Split paragraph roughly evenly
          const words = paragraph.split(' ');
          const wordsPerSlide = Math.ceil(words.length / slideCount);
          const slides: string[] = [];
          for (let i = 0; i < slideCount; i++) {
            const start = i * wordsPerSlide;
            const end = Math.min(start + wordsPerSlide, words.length);
            slides.push(words.slice(start, end).join(' '));
          }

          const dimensions = INSTA_DIMENSIONS[format];
          const baseFilename = `quote-${slugify(entry.slug)}`;

          // Generate QR code for last slide only (link to full entry)
          const extendedMeta: ExtendedQuoteMetadata = {
            quote: paragraph,
            sourceTitle: entry.title,
            date: entry.date,
            slug: entry.slug,
          };
          const contentUrl = getContentUrl('quote', extendedMeta);
          const qrDataUrl = await generateQRDataUrl(contentUrl);

          for (let i = 0; i < slides.length; i++) {
            const slideText = i === 0 ? slides[i] : `...${slides[i]}`;
            const isLast = i === slides.length - 1;
            const finalText = isLast ? slideText : `${slideText}...`;

            const element = QuoteTemplate({
              quote: finalText,
              sourceTitle: entry.title,
              date: entry.date,
              format,
              // Only show QR on last slide
              qrDataUrl: isLast ? qrDataUrl : undefined,
            });

            const filename = `${baseFilename}-${i + 1}.png`;
            const path = join(OUTPUT_DIR, filename);
            const png = await generatePng(element, fonts, dimensions);
            await writeFile(path, png);
            console.log(`  Generated: ${filename}`);
          }

          outputPath = join(OUTPUT_DIR, `${baseFilename}-1.png`);
        } else {
          // Single quote card with QR code
          const extendedMeta: ExtendedQuoteMetadata = {
            quote: paragraph,
            sourceTitle: entry.title,
            date: entry.date,
            slug: entry.slug,
          };
          const contentUrl = getContentUrl('quote', extendedMeta);
          const qrDataUrl = await generateQRDataUrl(contentUrl);

          const element = QuoteTemplate({
            quote: paragraph,
            sourceTitle: entry.title,
            date: entry.date,
            format,
            qrDataUrl,
          });

          const filename = `quote-${slugify(entry.slug)}-${Date.now()}.png`;
          outputPath = join(OUTPUT_DIR, filename);
          const dimensions = INSTA_DIMENSIONS[format];
          const png = await generatePng(element, fonts, dimensions);
          await writeFile(outputPath, png);
          console.log(`  Generated: ${filename}`);

          // Track metadata for publishing
          const quoteMeta: QuoteMetadata = {
            quote: paragraph,
            sourceTitle: entry.title,
            date: entry.date,
          };
          generatedPost = {
            templateType: 'quote',
            imagePath: outputPath,
            metadata: quoteMeta,
          };
        }
      } else {
        // Title card with QR code
        const extendedMeta: ExtendedTitleMetadata = {
          title: entry.title,
          titleSecondary: entry.titleSecondary,
          date: entry.date,
          isDiptych: entry.type === 'diptych',
          slug: entry.slug,
        };
        const contentUrl = getContentUrl('title', extendedMeta);
        const qrDataUrl = await generateQRDataUrl(contentUrl);

        const element = TitleTemplate({
          title: entry.title,
          titleSecondary: entry.titleSecondary,
          date: entry.date,
          isDiptych: entry.type === 'diptych',
          format,
          qrDataUrl,
        });

        const filename = `title-${slugify(entry.slug)}.png`;
        outputPath = join(OUTPUT_DIR, filename);
        const dimensions = INSTA_DIMENSIONS[format];
        const png = await generatePng(element, fonts, dimensions);
        await writeFile(outputPath, png);
        console.log(`  Generated: ${filename}`);

        // Track metadata for publishing
        const titleMeta: TitleMetadata = {
          title: entry.title,
          titleSecondary: entry.titleSecondary,
          date: entry.date,
          isDiptych: entry.type === 'diptych',
        };
        generatedPost = {
          templateType: 'title',
          imagePath: outputPath,
          metadata: titleMeta,
        };
      }
    } else if (templateType === 'status') {
      // Load ahora entries
      const entries = await loadAhoraEntries();
      if (entries.length === 0) {
        console.log('  No ahora entries found.\n');
        continue;
      }

      const entryOrBack = await select<AhoraEntry | typeof BACK>({
        message: 'Select ahora dispatch:',
        choices: withBack(entries.map((e) => ({
          value: e,
          name: formatDate(e.date),
        }))),
      });

      if (entryOrBack === BACK) continue;
      const entry = entryOrBack as AhoraEntry;

      // Generate QR code for status (links to /now)
      const statusMeta: StatusMetadata = {
        date: entry.date,
        temperatura: entry.temperatura,
        escuchando: entry.escuchando,
        cultivando: entry.cultivando,
      };
      const contentUrl = getContentUrl('status', statusMeta);
      const qrDataUrl = await generateQRDataUrl(contentUrl);

      const element = StatusTemplate({
        date: entry.date,
        temperatura: entry.temperatura,
        escuchando: entry.escuchando,
        cultivando: entry.cultivando,
        format,
        qrDataUrl,
      });

      const dateStr = entry.date.toISOString().split('T')[0];
      const filename = `ahora-${dateStr}.png`;
      outputPath = join(OUTPUT_DIR, filename);
      const dimensions = INSTA_DIMENSIONS[format];
      const png = await generatePng(element, fonts, dimensions);
      await writeFile(outputPath, png);
      console.log(`  Generated: ${filename}`);

      // Track metadata for publishing
      generatedPost = {
        templateType: 'status',
        imagePath: outputPath,
        metadata: statusMeta,
      };
    } else if (templateType === 'specimen') {
      // Specimen card
      const specimens = await loadSpecimens();
      if (specimens.length === 0) {
        console.log('  No specimens found.\n');
        continue;
      }

      const specimenOrBack = await select<Specimen | typeof BACK>({
        message: 'Select specimen:',
        choices: withBack(specimens.map((s) => ({
          value: s,
          name: `${s.name} (${s.status})`,
        }))),
      });

      if (specimenOrBack === BACK) continue;
      const specimen = specimenOrBack as Specimen;

      // Generate QR code for specimen (links to /conservatory#id)
      const extendedMeta: ExtendedSpecimenMetadata = {
        name: specimen.name,
        status: specimen.status,
        description: specimen.description,
        series: specimen.series,
        id: specimen.id,
      };
      const contentUrl = getContentUrl('specimen', extendedMeta);
      const qrDataUrl = await generateQRDataUrl(contentUrl);

      const element = SpecimenTemplate({
        name: specimen.name,
        status: specimen.status,
        description: specimen.description,
        series: specimen.series,
        seriesIndex: specimen.seriesIndex,
        format,
        qrDataUrl,
      });

      const filename = `specimen-${slugify(specimen.id)}.png`;
      outputPath = join(OUTPUT_DIR, filename);
      const dimensions = INSTA_DIMENSIONS[format];
      const png = await generatePng(element, fonts, dimensions);
      await writeFile(outputPath, png);
      console.log(`  Generated: ${filename}`);

      // Track metadata for publishing
      const specimenMeta: SpecimenMetadata = {
        name: specimen.name,
        status: specimen.status,
        description: specimen.description,
        series: specimen.series,
      };
      generatedPost = {
        templateType: 'specimen',
        imagePath: outputPath,
        metadata: specimenMeta,
      };
    } else if (templateType === 'intro') {
      // Generate intro carousel
      console.log('  Generating intro carousel...');

      const introSlides = getIntroSlides();
      const dimensions = INSTA_DIMENSIONS.square;
      const introPaths: string[] = [];

      for (let i = 0; i < introSlides.length; i++) {
        const slide = introSlides[i];
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
          format: 'square',
        });

        const path = join(OUTPUT_DIR, filename);
        const png = await generatePng(element, fonts, dimensions);
        await writeFile(path, png);
        introPaths.push(path);
        console.log(`  [${slideNum}] ${filename}`);
      }

      outputPath = introPaths[0]; // For preview
      console.log(`  Generated ${introSlides.length} slides`);

      // Track carousel for publishing
      const introMeta: IntroMetadata = { slideCount: introSlides.length };
      generatedCarousel = {
        templateType: 'intro',
        imagePaths: introPaths,
        metadata: introMeta,
      };
    }

    // Preview option
    const shouldPreview = await confirm({
      message: 'Preview image?',
      default: true,
    });

    if (shouldPreview) {
      await openImage(outputPath);
    }

    console.log(`  Output: ${outputPath}\n`);

    // Publish option
    if (publishMode && generatedPost) {
      const shouldPublish = await confirm({
        message: 'Publish to Instagram via Buffer?',
        default: true,
      });

      if (shouldPublish) {
        await publishToBuffer(generatedPost);
      }
    }

    // Publish carousel option
    if (publishMode && generatedCarousel) {
      const shouldPublish = await confirm({
        message: `Publish carousel (${generatedCarousel.imagePaths.length} images) to Instagram via Buffer?`,
        default: true,
      });

      if (shouldPublish) {
        await publishCarouselToBuffer(generatedCarousel);
      }
    }

    // Continue?
    continueGenerating = await confirm({
      message: 'Generate another?',
      default: true,
    });
  }

  console.log('  ✦ done\n');
}

// ─────────────────────────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────────────────────────

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
  ✦ instagram content generator

  Usage:
    npm run insta                        Interactive mode
    npm run insta -- --publish           Generate and schedule to Buffer
    npx tsx scripts/insta-gen.ts --help  Show this help

  Options:
    --publish, -p    Enable publishing flow (upload to R2, schedule on Buffer)

  Templates:
    quote      Extract a paragraph from a journal entry
    title      Journal entry title with date and mandala
    status     Ahora dispatch fields (temperatura, escuchando, etc.)
    specimen   Specimen card from conservatory
    intro      Welcome carousel (10 slides introducing the garden)

  Formats:
    square     1080×1080 (feed posts)
    portrait   1080×1350 (feed posts, more vertical)

  Output:
    Images saved to ./insta-output/{type}-{slug}.png
    Metadata saved to ./insta-output/{type}-{slug}.json (with --publish)

  Environment variables (for --publish):
    BUFFER_API_KEY        Buffer API key
    BUFFER_CHANNEL_ID     Buffer Instagram channel ID
    CF_ACCOUNT_ID         Cloudflare account ID (already set)
    R2_ACCESS_KEY_ID      R2 access key
    R2_SECRET_ACCESS_KEY  R2 secret key
    R2_BUCKET_NAME        R2 bucket name
    R2_PUBLIC_URL         R2 public URL
`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────
// Exports for testing
// ─────────────────────────────────────────────────────────────

export { parseFrontmatter, extractBody, extractParagraphs, truncate, parseLocalDate, formatDate, slugify };
