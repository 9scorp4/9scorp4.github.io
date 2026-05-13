/**
 * Metalogue Instagram card generator
 *
 * Generates carousel cards from diptych metalogue dialogues.
 * Parses speaker/line exchanges from _metalogue.md files.
 *
 * Usage:
 *   jardin insta metalogue           Interactive mode
 *   jardin insta metalogue --publish Generate and publish to Buffer
 */

import { select, confirm, checkbox } from '@inquirer/prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadFonts, generatePng } from '../../../src/lib/shared-image-utils.ts';
import {
  MetalogueTemplate,
  INSTA_DIMENSIONS,
  type InstaFormat,
} from '../../../src/lib/insta-templates.tsx';
import type { MetalogueMetadata } from '../../../src/lib/insta-captions.ts';
import { generateQRDataUrl, getContentUrl } from '../../../src/lib/qr-utils.ts';
import { title, print, success, muted, blank, divider } from '../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  formatDate,
  slugify,
  openFile,
  getProjectRoot,
  getOutputDir,
} from '../../lib/cli-utils.ts';
import {
  loadDiptychEntries,
  loadMetalogueContent,
  groupIntoSlides,
  type DiptychEntry,
} from '../../lib/metalogue-parser.ts';
import {
  publishCarouselToBuffer,
  type GeneratedCarousel,
} from '../../lib/metalogue-publisher.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();

const FORMAT: InstaFormat = 'square';
const dimensions = INSTA_DIMENSIONS[FORMAT];

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function run(_args: string[], publishMode = false): Promise<void> {
  title('metalogue generator');
  print(`format: ${FORMAT} (${dimensions.width}×${dimensions.height})`);
  blank();

  // Load diptych entries
  print('loading diptych entries...');
  const entries = await loadDiptychEntries();

  if (entries.length === 0) {
    muted('No diptych entries found.');
    blank();
    return;
  }

  const entriesWithMetalogue = entries.filter((e) => e.hasMetalogue);
  if (entriesWithMetalogue.length === 0) {
    muted('No diptych entries with _metalogue.md files found.');
    blank();
    return;
  }

  success(`${entriesWithMetalogue.length} diptych entries with metalogues`);
  blank();

  // Select entry
  const entryOrBack = await select<DiptychEntry | typeof BACK>({
    message: 'Select diptych entry:',
    choices: withBack(
      entriesWithMetalogue.map((e) => ({
        value: e,
        name: `${e.title} (${formatDate(e.date)})`,
      }))
    ),
  });

  if (entryOrBack === BACK) return;
  const entry = entryOrBack as DiptychEntry;

  // Load metalogue
  print('parsing metalogue...');
  const allFragments = await loadMetalogueContent(entry.slug);
  success(`${allFragments.length} dialogue exchanges found`);
  blank();

  if (allFragments.length === 0) {
    muted('No dialogue exchanges found in metalogue.');
    blank();
    return;
  }

  // Display preview of all exchanges
  print('Available exchanges:');
  divider();
  for (let i = 0; i < allFragments.length; i++) {
    const f = allFragments[i];
    const preview = f.line.length > 60 ? f.line.slice(0, 60) + '...' : f.line;
    muted(`[${i + 1}] ${f.speaker}: ${preview}`);
  }
  divider();
  blank();

  // Select exchanges to include
  const selectedIndices = await checkbox({
    message: 'Select exchanges to include in carousel:',
    choices: allFragments.map((f, i) => ({
      value: i,
      name: `[${i + 1}] ${f.speaker}: ${f.line.slice(0, 50)}${f.line.length > 50 ? '...' : ''}`,
      checked: true, // Default all selected
    })),
  });

  if (selectedIndices.length === 0) {
    muted('No exchanges selected.');
    blank();
    return;
  }

  const selectedFragments = selectedIndices.map((i) => allFragments[i]);
  const slides = groupIntoSlides(selectedFragments);

  print(`Selected ${selectedFragments.length} exchanges, generating ${slides.length} slide(s)`);
  blank();

  // Prepare fonts
  print('loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  await mkdir(OUTPUT_DIR, { recursive: true });

  // Generate metadata
  const metalogueMeta: MetalogueMetadata = {
    fragments: selectedFragments,
    sourceTitle: entry.title,
    date: entry.date,
    slug: entry.slug,
  };
  const metalogueQrUrl = await generateQRDataUrl(getContentUrl('metalogue', metalogueMeta));

  // Generate slides
  const imagePaths: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const isLast = i === slides.length - 1;
    const slideNum = String(i + 1).padStart(2, '0');
    const filename = `metalogue-${slugify(entry.slug)}-${slideNum}.png`;
    const path = join(OUTPUT_DIR, filename);

    const element = MetalogueTemplate({
      fragments: slides[i],
      sourceTitle: entry.title,
      date: entry.date,
      format: FORMAT,
      qrDataUrl: isLast ? metalogueQrUrl : undefined,
    });

    const png = await generatePng(element, fonts, dimensions);
    await writeFile(path, png);
    imagePaths.push(path);
    success(`[${slideNum}] ${filename}`);
  }

  blank();
  success(`Generated ${slides.length} slide(s) in ${OUTPUT_DIR}`);
  blank();

  // Preview
  const shouldPreview = await confirm({
    message: 'Preview first slide?',
    default: true,
  });

  if (shouldPreview) {
    openFile(imagePaths[0]);
  }

  // Publish
  if (publishMode) {
    const carousel: GeneratedCarousel = {
      imagePaths,
      metadata: metalogueMeta,
    };

    const shouldPublish = await confirm({
      message: `Publish metalogue (${imagePaths.length} image${imagePaths.length > 1 ? 's' : ''}) to Buffer?`,
      default: true,
    });

    if (shouldPublish) {
      await publishCarouselToBuffer(carousel);
    }
  }

  success('done');
  blank();
}

// ─────────────────────────────────────────────────────────────
// Exports for testing
// ─────────────────────────────────────────────────────────────

export { parseMetalogueContent, groupIntoSlides } from '../../lib/metalogue-parser.ts';
