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
import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  loadFonts,
  generatePng,
} from '../../../src/lib/shared-image-utils.ts';
import {
  MetalogueTemplate,
  INSTA_DIMENSIONS,
  type InstaFormat,
  type MetalogueFragment,
} from '../../../src/lib/insta-templates.tsx';
import {
  generateCaption,
  createPostMetadata,
  type MetalogueMetadata,
  type SavedPostMetadata,
} from '../../../src/lib/insta-captions.ts';
import {
  generateQRDataUrl,
  getContentUrl,
} from '../../../src/lib/qr-utils.ts';
import { uploadToR2 } from '../../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createCarouselPost,
  createPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../../../src/lib/buffer-client.ts';
import { title, print, success, error, muted, blank, divider } from '../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  parseLocalDate,
  formatDate,
  slugify,
  openFile,
  parseFrontmatter,
  getProjectRoot,
  getOutputDir,
  getContentDir,
} from '../../lib/cli-utils.ts';
import { input } from '@inquirer/prompts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();
const CONTENT_DIR = getContentDir();

const FORMAT: InstaFormat = 'square';
const dimensions = INSTA_DIMENSIONS[FORMAT];

/** Fragments per carousel slide */
const FRAGMENTS_PER_SLIDE = 3;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DiptychEntry {
  slug: string;
  title: string;
  titleSecondary?: string;
  date: Date;
  hasMetalogue: boolean;
}

interface GeneratedCarousel {
  imagePaths: string[];
  metadata: MetalogueMetadata;
}

// ─────────────────────────────────────────────────────────────
// Content loading
// ─────────────────────────────────────────────────────────────

async function loadDiptychEntries(): Promise<DiptychEntry[]> {
  const journalDir = join(CONTENT_DIR, 'journal');
  const entries: DiptychEntry[] = [];

  let items: string[];
  try {
    items = await readdir(journalDir);
  } catch {
    return entries;
  }

  for (const item of items) {
    const itemPath = join(journalDir, item);
    const itemStat = await stat(itemPath);

    if (itemStat.isDirectory()) {
      const indexPath = join(itemPath, 'index.md');
      const metaloguePath = join(itemPath, '_metalogue.md');

      try {
        const content = await readFile(indexPath, 'utf-8');
        const fm = parseFrontmatter(content);

        // Only include diptych entries
        if (fm.type === 'diptych' && !fm.draft) {
          // Check if metalogue file exists
          let hasMetalogue = false;
          try {
            await stat(metaloguePath);
            hasMetalogue = true;
          } catch {
            // No metalogue file
          }

          entries.push({
            slug: item,
            title: fm.title as string,
            titleSecondary: fm.title_secondary as string | undefined,
            date: parseLocalDate(fm.date as string),
            hasMetalogue,
          });
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw err;
        }
      }
    }
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Parse metalogue markdown into speaker/line fragments.
 *
 * Expected format:
 *   SPEAKER: Line text here
 *   ANOTHER: Another line
 *   ---
 *   (scene break, ignored)
 */
function parseMetalogueContent(content: string): MetalogueFragment[] {
  const fragments: MetalogueFragment[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip empty lines and scene breaks
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') continue;

    // Match speaker pattern: "SPEAKER: text" or "SPEAKER: text ^anchor"
    // Speaker can include accented characters (GIÁP, etc.)
    const match = trimmed.match(/^([A-Z\u00C0-\u017F]+)\s*:\s*(.+)/);
    if (match) {
      const speaker = match[1];
      // Remove anchor markers like ^figura-armada
      let lineText = match[2].replace(/\s*\^[\w-]+\s*$/, '').trim();

      // Skip "..." only lines
      if (lineText === '...') continue;

      fragments.push({ speaker, line: lineText });
    }
  }

  return fragments;
}

async function loadMetalogueContent(slug: string): Promise<MetalogueFragment[]> {
  const metaloguePath = join(CONTENT_DIR, 'journal', slug, '_metalogue.md');
  const content = await readFile(metaloguePath, 'utf-8');
  return parseMetalogueContent(content);
}

// ─────────────────────────────────────────────────────────────
// Slide grouping
// ─────────────────────────────────────────────────────────────

function groupIntoSlides(fragments: MetalogueFragment[]): MetalogueFragment[][] {
  const slides: MetalogueFragment[][] = [];

  for (let i = 0; i < fragments.length; i += FRAGMENTS_PER_SLIDE) {
    slides.push(fragments.slice(i, i + FRAGMENTS_PER_SLIDE));
  }

  return slides;
}

// ─────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────

async function publishCarouselToBuffer(carousel: GeneratedCarousel): Promise<void> {
  title('publishing metalogue to buffer');
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

  const defaults = generateCaption('metalogue', carousel.metadata);

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

  print('Scheduling on Buffer...');
  try {
    if (carousel.imagePaths.length === 1) {
      // Single image post
      const result = await createPost(bufferConfig.apiKey, {
        channelId: bufferConfig.channelId,
        text: caption,
        imageUrl: imageUrls[0],
        altText: 'Metalogue dialogue card',
        scheduledAt,
        firstComment: hashtags || undefined,
      });
      const timeStr = scheduledAt ? formatScheduledTime(scheduledAt) : 'added to queue';
      success(`Scheduled! Post ID: ${result.id}`);
      print(`Time: ${timeStr}`);
    } else {
      // Carousel
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
    }
    blank();

    // Save metadata
    const metadataPath = carousel.imagePaths[0].replace(/\.png$/, '.json');
    const savedMeta: SavedPostMetadata = {
      ...createPostMetadata('metalogue', carousel.metadata, caption, hashtags),
      published: true,
      publishedAt: new Date().toISOString(),
    };
    await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
  } catch (err) {
    error(`Failed to schedule: ${(err as Error).message}`);
    blank();
  }
}

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

  const entriesWithMetalogue = entries.filter(e => e.hasMetalogue);
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
    choices: withBack(entriesWithMetalogue.map((e) => ({
      value: e,
      name: `${e.title} (${formatDate(e.date)})`,
    }))),
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

  const selectedFragments = selectedIndices.map(i => allFragments[i]);
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

export { parseMetalogueContent, groupIntoSlides };
