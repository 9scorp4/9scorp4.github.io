/**
 * Interactive Instagram card generator
 *
 * Generates quote, title, status, specimen, and intro carousel cards.
 * Uses Satori + Resvg for rendering.
 */

import { select, confirm, input } from '@inquirer/prompts';
import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as yaml from 'yaml';
import {
  loadFonts,
  generatePng,
} from '../../../src/lib/shared-image-utils.ts';
import {
  QuoteTemplate,
  TitleTemplate,
  StatusTemplate,
  SpecimenTemplate,
  IntroSlideTemplate,
  INSTA_DIMENSIONS,
  colors,
  type InstaFormat,
} from '../../../src/lib/insta-templates.tsx';
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
} from '../../../src/lib/insta-captions.ts';
import {
  generateQRDataUrl,
  getContentUrl,
  type ExtendedQuoteMetadata,
  type ExtendedTitleMetadata,
  type ExtendedSpecimenMetadata,
} from '../../../src/lib/qr-utils.ts';
import { uploadToR2 } from '../../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createPost,
  createCarouselPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../../../src/lib/buffer-client.ts';
import React from 'react';
import { title, print, success, error, muted, blank } from '../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  parseLocalDate,
  formatDate,
  slugify,
  truncate,
  openFile,
  parseFrontmatter,
  extractBody,
  getProjectRoot,
  getOutputDir,
  getContentDir,
} from '../../lib/cli-utils.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();
const CONTENT_DIR = getContentDir();

/** Minimum chars for a paragraph to be quote-worthy */
const MIN_PARAGRAPH_LENGTH = 50;

/** Max chars in CLI paragraph picker */
const CLI_TRUNCATE_LENGTH = 80;

// ─────────────────────────────────────────────────────────────
// Content types
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

// ─────────────────────────────────────────────────────────────
// Content loading
// ─────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

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

async function loadJournalEntries(): Promise<JournalEntry[]> {
  const journalDir = join(CONTENT_DIR, 'journal');
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
      }
    }
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function loadJournalBody(slug: string): Promise<string> {
  const articlePath = join(CONTENT_DIR, 'journal', slug, '_article.md');
  try {
    return await readFile(articlePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      const indexPath = join(CONTENT_DIR, 'journal', slug, 'index.md');
      const content = await readFile(indexPath, 'utf-8');
      return extractBody(content);
    }
    throw err;
  }
}

function formatEscuchando(fm: Record<string, unknown>): string | undefined {
  const esc = fm.escuchando;
  if (!esc) return undefined;

  if (Array.isArray(esc) && esc.length > 0) {
    const track = esc[0] as { artist?: string; title?: string };
    if (track.artist && track.title) {
      return `${track.artist} — ${track.title}`;
    }
  }

  if (typeof esc === 'string') {
    return esc;
  }

  return undefined;
}

async function loadAhoraEntries(): Promise<AhoraEntry[]> {
  const ahoraDir = join(CONTENT_DIR, 'ahora');
  const entries: AhoraEntry[] = [];
  const files = await readdir(ahoraDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(join(ahoraDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const body = extractBody(content);

    const temperatura = body.match(/\*temperatura:\*\s*(.+)/i)?.[1]?.trim();
    const cultivando =
      body.match(/\*creciendo:\*\s*(.+)/i)?.[1]?.trim() ||
      body.match(/\*cultivando:\*\s*(.+)/i)?.[1]?.trim();
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

async function loadSpecimens(): Promise<Specimen[]> {
  const specDir = join(CONTENT_DIR, 'specimens');
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

function StatusSymbols() {
  const statuses = [
    { status: 'growing', label: 'growing', color: colors.fern },
    { status: 'dormant', label: 'dormant', color: colors.ochre },
    { status: 'wild', label: 'wild', color: colors.inkSoft },
    { status: 'composted', label: 'composted', color: colors.inkFaint },
  ];

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'row', gap: '48px', flexWrap: 'wrap', justifyContent: 'center' },
  }, statuses.map(({ status, label, color }) =>
    React.createElement('div', {
      key: label,
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    },
      React.createElement(StatusSvg, { status, color, size: 48 }),
      React.createElement('div', {
        style: { display: 'flex', fontFamily: 'IM Fell DW Pica', fontSize: '18px', color: colors.inkFaint, letterSpacing: '0.1em' },
      }, label)
    )
  ));
}

function PromptGlyph() {
  return React.createElement('div', {
    style: { display: 'flex', fontFamily: 'monospace', fontSize: '72px', color: colors.sun },
  }, '>');
}

function LibraryNames() {
  const names = ['bateson', 'beer', 'maturana', 'pask', 'wiener', 'von foerster'];
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  },
    React.createElement('div', {
      style: { display: 'flex', fontFamily: 'IM Fell DW Pica', fontSize: '22px', color: colors.inkSoft, fontStyle: 'italic', letterSpacing: '0.05em' },
    }, names.join(' / '))
  );
}

function getIntroSlides(): IntroSlideConfig[] {
  return [
    { headline: 'el jardin cibernetico', subtext: 'a garden that documents itself', showMandala: true },
    { headline: 'el ahora', subtext: "what's happening now, updated whenever", showSunAccent: true },
    { headline: 'el invernadero', subtext: 'generative sketches, numbered like specimens', showSunAccent: true },
    { headline: 'cuaderno de campo', subtext: 'long-form notes, some answer themselves back', showSunAccent: true },
    { headline: 'los cultivos', subtext: 'projects in various states', customVisual: React.createElement(StatusSymbols) },
    { headline: 'la biblioteca', customVisual: React.createElement(LibraryNames), showSunAccent: true },
    { headline: 'libro de visitas', subtext: 'leave a note, or type something unexpected', customVisual: React.createElement(PromptGlyph) },
    { headline: 'there are secrets in the root system', subtext: '8 hidden. more to come.', showSunAccent: true },
    { headline: 'open devtools sometime', subtext: 'try window.garden', monospace: true, showSunAccent: true },
    { headline: 'like a garden, it grows', showMandala: true, siteUrl: '9scorp4.github.io', showSiteFooter: true },
  ];
}

// ─────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────

async function publishToBuffer(post: GeneratedPost): Promise<void> {
  title('publishing to buffer');

  let bufferConfig;
  try {
    bufferConfig = loadBufferConfig();
  } catch (err) {
    error((err as Error).message);
    print('Add BUFFER_API_KEY and BUFFER_CHANNEL_ID to .env to enable publishing.');
    blank();
    return;
  }

  const defaults = generateCaption(post.templateType, post.metadata);

  const caption = await input({ message: 'Caption:', default: defaults.caption });
  const hashtags = await input({ message: 'Hashtags (first comment):', default: defaults.hashtags });

  const scheduleOptions = getScheduleOptions();
  const scheduleChoice = await select<string>({
    message: 'When to publish? (America/Montreal)',
    choices: [
      ...scheduleOptions.map((opt) => ({ value: opt.value ? opt.value.toISOString() : 'now', name: opt.label })),
      { value: 'custom', name: 'Custom date/time...' },
      { value: 'skip', name: 'Skip publishing' },
    ],
  });

  if (scheduleChoice === 'skip') {
    muted('Skipped publishing.');
    blank();
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

  print('Uploading image to R2...');
  let imageUrl: string;
  try {
    imageUrl = await uploadToR2(post.imagePath);
    success(`Uploaded: ${imageUrl}`);
  } catch (err) {
    error(`Failed to upload: ${(err as Error).message}`);
    print('Check R2 environment variables in .env');
    blank();
    return;
  }

  print('Scheduling post on Buffer...');
  try {
    const result = await createPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: caption,
      imageUrl,
      altText: `Instagram post: ${post.templateType}`,
      scheduledAt,
      firstComment: hashtags || undefined,
    });

    const timeStr = scheduledAt ? formatScheduledTime(scheduledAt) : 'added to queue';
    success(`Scheduled! Post ID: ${result.id}`);
    print(`Time: ${timeStr}`);
    blank();

    const metadataPath = post.imagePath.replace(/\.png$/, '.json');
    const savedMeta: SavedPostMetadata = {
      ...createPostMetadata(post.templateType, post.metadata, caption, hashtags),
      published: true,
      publishedAt: new Date().toISOString(),
      bufferId: result.id,
    };
    await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
  } catch (err) {
    error(`Failed to schedule: ${(err as Error).message}`);
    blank();
  }
}

async function publishCarouselToBuffer(carousel: GeneratedCarousel): Promise<void> {
  title('publishing carousel to buffer');
  print(`${carousel.imagePaths.length} images in carousel`);
  blank();

  let bufferConfig;
  try {
    bufferConfig = loadBufferConfig();
  } catch (err) {
    error((err as Error).message);
    print('Add BUFFER_API_KEY and BUFFER_CHANNEL_ID to .env to enable publishing.');
    blank();
    return;
  }

  const defaults = generateCaption(carousel.templateType, carousel.metadata);

  const caption = await input({ message: 'Caption:', default: defaults.caption });
  const hashtags = await input({ message: 'Hashtags (first comment):', default: defaults.hashtags });

  const scheduleOptions = getScheduleOptions();
  const scheduleChoice = await select<string>({
    message: 'When to publish? (America/Montreal)',
    choices: [
      ...scheduleOptions.map((opt) => ({ value: opt.value ? opt.value.toISOString() : 'now', name: opt.label })),
      { value: 'custom', name: 'Custom date/time...' },
      { value: 'skip', name: 'Skip publishing' },
    ],
  });

  if (scheduleChoice === 'skip') {
    muted('Skipped publishing.');
    blank();
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

  print('Uploading images to R2...');
  const imageUrls: string[] = [];
  try {
    for (let i = 0; i < carousel.imagePaths.length; i++) {
      const imagePath = carousel.imagePaths[i];
      const url = await uploadToR2(imagePath);
      imageUrls.push(url);
      print(`[${i + 1}/${carousel.imagePaths.length}] Uploaded`);
    }
  } catch (err) {
    error(`Failed to upload: ${(err as Error).message}`);
    print('Check R2 environment variables in .env');
    blank();
    return;
  }

  print('Scheduling carousel on Buffer...');
  try {
    const result = await createCarouselPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: caption,
      imageUrls,
      scheduledAt,
      firstComment: hashtags || undefined,
    });

    const timeStr = scheduledAt ? formatScheduledTime(scheduledAt) : 'added to queue';
    success(`Scheduled! Post ID: ${result.id}`);
    print(`Time: ${timeStr}`);
    blank();

    const metadataPath = carousel.imagePaths[0].replace(/\.png$/, '.json');
    const savedMeta: SavedPostMetadata = {
      ...createPostMetadata(carousel.templateType, carousel.metadata, caption, hashtags),
      published: true,
      publishedAt: new Date().toISOString(),
      bufferId: result.id,
    };
    await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
  } catch (err) {
    error(`Failed to schedule: ${(err as Error).message}`);
    blank();
  }
}

// ─────────────────────────────────────────────────────────────
// Main flow
// ─────────────────────────────────────────────────────────────

export async function run(_args: string[], publishMode = false): Promise<void> {
  title('instagram content generator');

  await mkdir(OUTPUT_DIR, { recursive: true });

  print('loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  let continueGenerating = true;

  while (continueGenerating) {
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

    let outputPath: string = '';
    let generatedPost: GeneratedPost | undefined;
    let generatedCarousel: GeneratedCarousel | undefined;

    if (templateType === 'quote' || templateType === 'title') {
      const entries = await loadJournalEntries();
      if (entries.length === 0) {
        muted('No journal entries found.');
        blank();
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
        const body = await loadJournalBody(entry.slug);
        const paragraphs = extractParagraphs(body);

        if (paragraphs.length === 0) {
          muted('No paragraphs found in this entry.');
          blank();
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

        const isCarousel = await confirm({
          message: 'Generate as carousel? (split into multiple slides)',
          default: false,
        });

        if (isCarousel) {
          const slideCount = await select<number>({
            message: 'Number of slides:',
            choices: [2, 3, 4, 5].map(n => ({ value: n, name: `${n} slides` })),
          });

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
              qrDataUrl: isLast ? qrDataUrl : undefined,
            });

            const filename = `${baseFilename}-${i + 1}.png`;
            const path = join(OUTPUT_DIR, filename);
            const png = await generatePng(element, fonts, dimensions);
            await writeFile(path, png);
            success(`Generated: ${filename}`);
          }

          outputPath = join(OUTPUT_DIR, `${baseFilename}-1.png`);
        } else {
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
          success(`Generated: ${filename}`);

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
        success(`Generated: ${filename}`);

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
      const entries = await loadAhoraEntries();
      if (entries.length === 0) {
        muted('No ahora entries found.');
        blank();
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
      success(`Generated: ${filename}`);

      generatedPost = {
        templateType: 'status',
        imagePath: outputPath,
        metadata: statusMeta,
      };
    } else if (templateType === 'specimen') {
      const specimens = await loadSpecimens();
      if (specimens.length === 0) {
        muted('No specimens found.');
        blank();
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
      success(`Generated: ${filename}`);

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
      print('Generating intro carousel...');

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
        success(`[${slideNum}] ${filename}`);
      }

      outputPath = introPaths[0];
      print(`Generated ${introSlides.length} slides`);

      const introMeta: IntroMetadata = { slideCount: introSlides.length };
      generatedCarousel = {
        templateType: 'intro',
        imagePaths: introPaths,
        metadata: introMeta,
      };
    }

    const shouldPreview = await confirm({
      message: 'Preview image?',
      default: true,
    });

    if (shouldPreview) {
      openFile(outputPath);
    }

    print(`Output: ${outputPath}`);
    blank();

    if (publishMode && generatedPost) {
      const shouldPublish = await confirm({
        message: 'Publish to Instagram via Buffer?',
        default: true,
      });

      if (shouldPublish) {
        await publishToBuffer(generatedPost);
      }
    }

    if (publishMode && generatedCarousel) {
      const shouldPublish = await confirm({
        message: `Publish carousel (${generatedCarousel.imagePaths.length} images) to Instagram via Buffer?`,
        default: true,
      });

      if (shouldPublish) {
        await publishCarouselToBuffer(generatedCarousel);
      }
    }

    continueGenerating = await confirm({
      message: 'Generate another?',
      default: true,
    });
  }

  success('done');
  blank();
}

// ─────────────────────────────────────────────────────────────
// Exports for testing
// ─────────────────────────────────────────────────────────────

export { extractParagraphs };
