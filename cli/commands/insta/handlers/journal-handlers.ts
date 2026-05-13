/**
 * Handlers for journal-based card generation (quote and title).
 */

import { select, confirm } from '@inquirer/prompts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generatePng } from '../../../../src/lib/shared-image-utils.ts';
import {
  QuoteTemplate,
  TitleTemplate,
  INSTA_DIMENSIONS,
} from '../../../../src/lib/insta-templates.tsx';
import type {
  QuoteMetadata,
  TitleMetadata,
} from '../../../../src/lib/insta-captions.ts';
import {
  generateQRDataUrl,
  getContentUrl,
  type ExtendedQuoteMetadata,
  type ExtendedTitleMetadata,
} from '../../../../src/lib/qr-utils.ts';
import { muted, success, blank } from '../../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  formatDate,
  slugify,
  truncate,
} from '../../../lib/cli-utils.ts';
import {
  loadJournalEntries,
  loadJournalBody,
  extractParagraphs,
  type JournalEntry,
} from '../../../lib/content-loaders.ts';
import type { HandlerContext, HandlerResult } from './types.ts';

/** Max chars in CLI paragraph picker */
const CLI_TRUNCATE_LENGTH = 80;

/**
 * Select a journal entry for quote or title card generation.
 * Returns the selected entry or BACK symbol.
 */
async function selectJournalEntry(): Promise<JournalEntry | typeof BACK | null> {
  const entries = await loadJournalEntries();
  if (entries.length === 0) {
    muted('No journal entries found.');
    blank();
    return null;
  }

  return select<JournalEntry | typeof BACK>({
    message: 'Select journal entry:',
    choices: withBack(entries.map((e) => ({
      value: e,
      name: `${e.title} (${formatDate(e.date)})${e.type === 'diptych' ? ' ⁂' : ''}`,
    }))),
  });
}

/**
 * Generate quote card from journal entry paragraph.
 * Supports single image or carousel split.
 */
export async function handleQuoteCard(ctx: HandlerContext): Promise<HandlerResult> {
  const entryOrBack = await selectJournalEntry();
  if (entryOrBack === null) return { status: 'skip', message: 'No journal entries found' };
  if (entryOrBack === BACK) return { status: 'back' };
  const entry = entryOrBack;

  const body = await loadJournalBody(entry.slug);
  const paragraphs = extractParagraphs(body);

  if (paragraphs.length === 0) {
    muted('No paragraphs found in this entry.');
    blank();
    return { status: 'skip', message: 'No paragraphs found' };
  }

  const paragraphOrBack = await select<string | typeof BACK>({
    message: 'Select paragraph to quote:',
    choices: withBack(paragraphs.map((p, i) => ({
      value: p,
      name: `[${i + 1}] ${truncate(p, CLI_TRUNCATE_LENGTH)}`,
    }))),
  });

  if (paragraphOrBack === BACK) return { status: 'back' };
  const paragraph = paragraphOrBack as string;

  const isCarousel = await confirm({
    message: 'Generate as carousel? (split into multiple slides)',
    default: false,
  });

  if (isCarousel) {
    return generateQuoteCarousel(ctx, entry, paragraph);
  }

  return generateSingleQuote(ctx, entry, paragraph);
}

/**
 * Generate a single quote image.
 */
async function generateSingleQuote(
  ctx: HandlerContext,
  entry: JournalEntry,
  paragraph: string
): Promise<HandlerResult> {
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
    format: ctx.format,
    qrDataUrl,
  });

  const filename = `quote-${slugify(entry.slug)}-${Date.now()}.png`;
  const outputPath = join(ctx.outputDir, filename);
  const dimensions = INSTA_DIMENSIONS[ctx.format];
  const png = await generatePng(element, ctx.fonts, dimensions);
  await writeFile(outputPath, png);
  success(`Generated: ${filename}`);

  const quoteMeta: QuoteMetadata = {
    quote: paragraph,
    sourceTitle: entry.title,
    date: entry.date,
  };

  return {
    status: 'success',
    outputPath,
    post: {
      templateType: 'quote',
      imagePath: outputPath,
      metadata: quoteMeta,
    },
  };
}

/**
 * Generate a quote carousel (2-5 slides).
 */
async function generateQuoteCarousel(
  ctx: HandlerContext,
  entry: JournalEntry,
  paragraph: string
): Promise<HandlerResult> {
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

  const dimensions = INSTA_DIMENSIONS[ctx.format];
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
      format: ctx.format,
      qrDataUrl: isLast ? qrDataUrl : undefined,
    });

    const filename = `${baseFilename}-${i + 1}.png`;
    const path = join(ctx.outputDir, filename);
    const png = await generatePng(element, ctx.fonts, dimensions);
    await writeFile(path, png);
    success(`Generated: ${filename}`);
  }

  return {
    status: 'success',
    outputPath: join(ctx.outputDir, `${baseFilename}-1.png`),
    // No post/carousel metadata for quote carousel (manual publish)
  };
}

/**
 * Generate title card from journal entry.
 */
export async function handleTitleCard(ctx: HandlerContext): Promise<HandlerResult> {
  const entryOrBack = await selectJournalEntry();
  if (entryOrBack === null) return { status: 'skip', message: 'No journal entries found' };
  if (entryOrBack === BACK) return { status: 'back' };
  const entry = entryOrBack;

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
    format: ctx.format,
    qrDataUrl,
  });

  const filename = `title-${slugify(entry.slug)}.png`;
  const outputPath = join(ctx.outputDir, filename);
  const dimensions = INSTA_DIMENSIONS[ctx.format];
  const png = await generatePng(element, ctx.fonts, dimensions);
  await writeFile(outputPath, png);
  success(`Generated: ${filename}`);

  const titleMeta: TitleMetadata = {
    title: entry.title,
    titleSecondary: entry.titleSecondary,
    date: entry.date,
    isDiptych: entry.type === 'diptych',
  };

  return {
    status: 'success',
    outputPath,
    post: {
      templateType: 'title',
      imagePath: outputPath,
      metadata: titleMeta,
    },
  };
}
