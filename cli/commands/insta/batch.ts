/**
 * Batch Instagram card generator
 *
 * Generates cards for unpublished entries from batch-queue.yaml.
 *
 * Usage:
 *   jardin insta batch --last=3      Generate for last N unpublished entries
 *   jardin insta batch --all         Generate all unpublished entries
 *   jardin insta batch --dry-run     Preview what would be generated
 *   jardin insta batch --publish     Generate and schedule to Buffer
 */

import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
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
  INSTA_DIMENSIONS,
  type InstaFormat,
} from '../../../src/lib/insta-templates.tsx';
import {
  generateQRDataUrl,
  getContentUrl,
  type ExtendedQuoteMetadata,
  type ExtendedTitleMetadata,
} from '../../../src/lib/qr-utils.ts';
import {
  generateCaption,
  createPostMetadata,
  type TemplateType,
  type StatusMetadata,
  type TitleMetadata,
  type QuoteMetadata,
  type SavedPostMetadata,
} from '../../../src/lib/insta-captions.ts';
import { uploadToR2 } from '../../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createPost,
  createCarouselPost,
  formatScheduledTime,
  type BufferConfig,
} from '../../../src/lib/buffer-client.ts';
import { title, print, success, error, muted, blank, divider, warning } from '../../lib/cli-style.ts';
import { parseLocalDate, parseFrontmatter, extractBody, getProjectRoot, getOutputDir, getContentDir, parseFlags } from '../../lib/cli-utils.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();
const CONTENT_DIR = getContentDir();

const FORMAT: InstaFormat = 'square';
const dimensions = INSTA_DIMENSIONS[FORMAT];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Entry from batch-queue.yaml: journal entry with quotes */
interface JournalQueueEntry {
  slug: string;
  quotes: string[];
}

/** Entry from batch-queue.yaml: status-only (ahora without journal) */
interface StatusOnlyQueueEntry {
  ahoraDate: string;
}

type QueueEntry = JournalQueueEntry | StatusOnlyQueueEntry;

function isJournalEntry(entry: QueueEntry): entry is JournalQueueEntry {
  return 'slug' in entry;
}

/** Loaded journal entry from content */
interface JournalEntry {
  slug: string;
  title: string;
  titleSecondary?: string;
  date: Date;
  type: 'article' | 'diptych';
  draft: boolean;
}

/** Loaded ahora dispatch from content */
interface AhoraEntry {
  date: Date;
  dateStr: string;
  temperatura?: string;
  escuchando?: string;
  cultivando?: string;
  articuloNuevo?: string[];
}

/** Resolved batch ready for generation */
interface ResolvedBatch {
  slug?: string;
  journal?: JournalEntry;
  ahora?: AhoraEntry;
  quotes?: string[];
  batchType: 'full' | 'status-only';
}

/** Generated image info */
interface GeneratedImage {
  path: string;
  filename: string;
  type: TemplateType;
  metadata: StatusMetadata | TitleMetadata | QuoteMetadata;
  isCarouselPart?: boolean;
  carouselIndex?: number;
  carouselTotal?: number;
}

/** Post ready for publishing */
interface PostToPublish {
  type: 'single' | 'carousel';
  templateType: TemplateType;
  images: GeneratedImage[];
  metadata: StatusMetadata | TitleMetadata | QuoteMetadata;
  batchIdx: number;
  postIdx: number;
}

/** Published entry info from metadata JSON */
interface PublishedInfo {
  slug?: string;
  date?: string;
  templateType: TemplateType;
}

// ─────────────────────────────────────────────────────────────
// Queue loading
// ─────────────────────────────────────────────────────────────

interface BatchQueue {
  entries: QueueEntry[];
}

async function loadBatchQueue(): Promise<BatchQueue> {
  const queuePath = join(PROJECT_ROOT, 'cli', 'batch-queue.yaml');

  let content: string;
  try {
    content = await readFile(queuePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `batch-queue.yaml not found.\n\n` +
        `Create cli/batch-queue.yaml with entries to generate:\n\n` +
        `  entries:\n` +
        `    - slug: my-entry\n` +
        `      quotes:\n` +
        `        - "Quote from the article..."\n`
      );
    }
    throw err;
  }

  const queue = yaml.parse(content) as BatchQueue;

  if (!queue.entries || !Array.isArray(queue.entries)) {
    throw new Error('batch-queue.yaml must have an "entries" array');
  }

  // Validate entries
  for (let i = 0; i < queue.entries.length; i++) {
    const entry = queue.entries[i];
    if (isJournalEntry(entry)) {
      if (!entry.slug || typeof entry.slug !== 'string') {
        throw new Error(`Entry ${i + 1}: missing or invalid "slug"`);
      }
      if (!entry.quotes || !Array.isArray(entry.quotes) || entry.quotes.length === 0) {
        throw new Error(`Entry ${i + 1} (${entry.slug}): missing or empty "quotes" array`);
      }
    } else if ('ahoraDate' in entry) {
      if (!entry.ahoraDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.ahoraDate)) {
        throw new Error(`Entry ${i + 1}: invalid "ahoraDate" format (use YYYY-MM-DD)`);
      }
    } else {
      throw new Error(`Entry ${i + 1}: must have either "slug" + "quotes" or "ahoraDate"`);
    }
  }

  return queue;
}

// ─────────────────────────────────────────────────────────────
// Content loading
// ─────────────────────────────────────────────────────────────

async function loadJournalEntries(): Promise<Map<string, JournalEntry>> {
  const journalDir = join(CONTENT_DIR, 'journal');
  const entries = new Map<string, JournalEntry>();

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
      try {
        const content = await readFile(indexPath, 'utf-8');
        const fm = parseFrontmatter(content);

        if (!fm.draft) {
          entries.set(item, {
            slug: item,
            title: fm.title as string,
            titleSecondary: fm.title_secondary as string | undefined,
            date: parseLocalDate(fm.date as string),
            type: (fm.type as 'article' | 'diptych') || 'article',
            draft: false,
          });
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw err;
        }
      }
    }
  }

  return entries;
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

async function loadAhoraEntries(): Promise<Map<string, AhoraEntry>> {
  const ahoraDir = join(CONTENT_DIR, 'ahora');
  const entries = new Map<string, AhoraEntry>();

  let files: string[];
  try {
    files = await readdir(ahoraDir);
  } catch {
    return entries;
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(join(ahoraDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    const body = extractBody(content);
    const dateStr = fm.date as string;

    const temperatura = body.match(/\*temperatura:\*\s*(.+)/i)?.[1]?.trim();
    const cultivando =
      body.match(/\*creciendo:\*\s*(.+)/i)?.[1]?.trim() ||
      body.match(/\*cultivando:\*\s*(.+)/i)?.[1]?.trim();
    const escuchando =
      formatEscuchando(fm) ||
      body.match(/\*escuchando:\*\s*(.+)/i)?.[1]?.trim();

    // Extract articuloNuevo references
    let articuloNuevo: string[] | undefined;
    if (Array.isArray(fm.articuloNuevo)) {
      articuloNuevo = (fm.articuloNuevo as Array<{ article?: string }>)
        .map(a => a.article)
        .filter((a): a is string => !!a);
    }

    entries.set(dateStr, {
      date: parseLocalDate(dateStr),
      dateStr,
      temperatura,
      escuchando,
      cultivando,
      articuloNuevo,
    });
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────
// Published detection
// ─────────────────────────────────────────────────────────────

async function findPublishedEntries(): Promise<PublishedInfo[]> {
  const published: PublishedInfo[] = [];

  let files: string[];
  try {
    files = await readdir(OUTPUT_DIR);
  } catch {
    return published;
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = await readFile(join(OUTPUT_DIR, file), 'utf-8');
      const meta = JSON.parse(content) as SavedPostMetadata;

      if (meta.published) {
        const info: PublishedInfo = { templateType: meta.templateType };

        // Extract slug from metadata if present
        if ('slug' in meta.metadata) {
          info.slug = meta.metadata.slug as string;
        }

        // Extract date from metadata
        if ('date' in meta.metadata) {
          const dateVal = meta.metadata.date;
          if (typeof dateVal === 'string') {
            info.date = dateVal.split('T')[0];
          } else if (dateVal instanceof Date) {
            info.date = dateVal.toISOString().split('T')[0];
          }
        }

        published.push(info);
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return published;
}

function isEntryPublished(
  entry: QueueEntry,
  published: PublishedInfo[]
): boolean {
  if (isJournalEntry(entry)) {
    // Check if both title and quote cards are published for this slug
    const hasTitle = published.some(
      p => p.templateType === 'title' && p.slug === entry.slug
    );
    const hasQuote = published.some(
      p => p.templateType === 'quote' && p.slug === entry.slug
    );
    return hasTitle && hasQuote;
  } else {
    // Check if status card is published for this date
    return published.some(
      p => p.templateType === 'status' && p.date === entry.ahoraDate
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Batch resolution
// ─────────────────────────────────────────────────────────────

function matchAhoraToJournal(
  slug: string,
  ahoraEntries: Map<string, AhoraEntry>
): AhoraEntry | undefined {
  // Find ahora that references this journal entry via articuloNuevo
  for (const ahora of ahoraEntries.values()) {
    if (ahora.articuloNuevo?.includes(slug)) {
      return ahora;
    }
  }
  return undefined;
}

function resolveQueueEntry(
  entry: QueueEntry,
  journalEntries: Map<string, JournalEntry>,
  ahoraEntries: Map<string, AhoraEntry>
): ResolvedBatch | null {
  if (isJournalEntry(entry)) {
    const journal = journalEntries.get(entry.slug);
    if (!journal) {
      warning(`Journal entry not found: ${entry.slug}`);
      return null;
    }

    const ahora = matchAhoraToJournal(entry.slug, ahoraEntries);

    return {
      slug: entry.slug,
      journal,
      ahora,
      quotes: entry.quotes,
      batchType: 'full',
    };
  } else {
    const ahora = ahoraEntries.get(entry.ahoraDate);
    if (!ahora) {
      warning(`Ahora dispatch not found: ${entry.ahoraDate}`);
      return null;
    }

    return {
      ahora,
      batchType: 'status-only',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────

function getScheduleTime(batchIdx: number, postIdx: number): Date {
  const now = new Date();
  const baseTime = new Date(now);
  baseTime.setDate(baseTime.getDate() + 1);
  baseTime.setHours(9, 0, 0, 0);

  const hoursOffset = (batchIdx * 24) + (postIdx * 4);
  baseTime.setHours(baseTime.getHours() + hoursOffset);

  return baseTime;
}

async function publishPost(
  post: PostToPublish,
  bufferConfig: BufferConfig,
  dryRun: boolean
): Promise<void> {
  const scheduledAt = getScheduleTime(post.batchIdx, post.postIdx);
  const defaults = generateCaption(post.templateType, post.metadata);

  if (dryRun) {
    muted(`[dry-run] Would publish ${post.type} to Buffer`);
    muted(`Caption: ${defaults.caption.slice(0, 50)}...`);
    muted(`Scheduled: ${formatScheduledTime(scheduledAt)}`);
    return;
  }

  print(`Uploading ${post.images.length} image(s) to R2...`);
  const imageUrls: string[] = [];
  for (const img of post.images) {
    const url = await uploadToR2(img.path);
    imageUrls.push(url);
  }

  if (post.type === 'carousel') {
    const result = await createCarouselPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: defaults.caption,
      imageUrls,
      scheduledAt,
      firstComment: defaults.hashtags,
    });
    success(`Carousel scheduled: ${formatScheduledTime(scheduledAt)} (ID: ${result.id})`);
  } else {
    const result = await createPost(bufferConfig.apiKey, {
      channelId: bufferConfig.channelId,
      text: defaults.caption,
      imageUrl: imageUrls[0],
      altText: `Instagram ${post.templateType} card`,
      scheduledAt,
      firstComment: defaults.hashtags,
    });
    success(`Post scheduled: ${formatScheduledTime(scheduledAt)} (ID: ${result.id})`);
  }

  const metadataPath = post.images[0].path.replace(/\.png$/, '.json');
  const savedMeta: SavedPostMetadata = {
    ...createPostMetadata(post.templateType, post.metadata, defaults.caption, defaults.hashtags),
    published: true,
    publishedAt: new Date().toISOString(),
  };
  await writeFile(metadataPath, JSON.stringify(savedMeta, null, 2));
}

// ─────────────────────────────────────────────────────────────
// Generation
// ─────────────────────────────────────────────────────────────

async function generateBatch(
  batch: ResolvedBatch,
  batchIdx: number,
  fonts: Awaited<ReturnType<typeof loadFonts>>,
  postsToPublish: PostToPublish[]
): Promise<number> {
  let totalCards = 0;
  let postIdxInBatch = 0;
  const batchNum = batchIdx + 1;

  // 1. Status card (if ahora exists)
  if (batch.ahora) {
    const statusMeta: StatusMetadata = {
      date: batch.ahora.date,
      temperatura: batch.ahora.temperatura,
      escuchando: batch.ahora.escuchando,
      cultivando: batch.ahora.cultivando,
    };
    const statusQrUrl = await generateQRDataUrl(getContentUrl('status', statusMeta));
    const statusElement = StatusTemplate({
      ...statusMeta,
      format: FORMAT,
      qrDataUrl: statusQrUrl,
    });
    const statusFilename = `batch${batchNum}-01-status-${batch.ahora.dateStr}.png`;
    const statusPath = join(OUTPUT_DIR, statusFilename);
    const statusPng = await generatePng(statusElement, fonts, dimensions);
    await writeFile(statusPath, statusPng);
    success(`[1] ${statusFilename}`);
    totalCards++;

    postsToPublish.push({
      type: 'single',
      templateType: 'status',
      images: [{ path: statusPath, filename: statusFilename, type: 'status', metadata: statusMeta }],
      metadata: statusMeta,
      batchIdx,
      postIdx: postIdxInBatch++,
    });
  }

  // 2. Title card (if journal exists)
  if (batch.journal) {
    const titleMeta: TitleMetadata & { slug: string } = {
      title: batch.journal.title,
      titleSecondary: batch.journal.titleSecondary,
      date: batch.journal.date,
      isDiptych: batch.journal.type === 'diptych',
      slug: batch.journal.slug,
    };
    const titleQrUrl = await generateQRDataUrl(getContentUrl('title', titleMeta));
    const titleElement = TitleTemplate({
      title: batch.journal.title,
      titleSecondary: batch.journal.titleSecondary,
      date: batch.journal.date,
      isDiptych: batch.journal.type === 'diptych',
      format: FORMAT,
      qrDataUrl: titleQrUrl,
    });
    const titleFilename = `batch${batchNum}-02-title-${batch.journal.slug}.png`;
    const titlePath = join(OUTPUT_DIR, titleFilename);
    const titlePng = await generatePng(titleElement, fonts, dimensions);
    await writeFile(titlePath, titlePng);
    success(`[2] ${titleFilename}`);
    totalCards++;

    postsToPublish.push({
      type: 'single',
      templateType: 'title',
      images: [{ path: titlePath, filename: titleFilename, type: 'title', metadata: titleMeta }],
      metadata: titleMeta,
      batchIdx,
      postIdx: postIdxInBatch++,
    });

    // 3. Quote carousel (if quotes exist)
    if (batch.quotes && batch.quotes.length > 0) {
      const quoteMeta: QuoteMetadata & { slug: string } = {
        quote: batch.quotes.join(' '),
        sourceTitle: batch.journal.title,
        date: batch.journal.date,
        slug: batch.journal.slug,
      };
      const quoteQrUrl = await generateQRDataUrl(getContentUrl('quote', quoteMeta));
      const carouselImages: GeneratedImage[] = [];

      for (let i = 0; i < batch.quotes.length; i++) {
        const isLast = i === batch.quotes.length - 1;
        const quoteElement = QuoteTemplate({
          quote: batch.quotes[i],
          sourceTitle: batch.journal.title,
          date: batch.journal.date,
          format: FORMAT,
          qrDataUrl: isLast ? quoteQrUrl : undefined,
        });
        const slideNum = String(i + 1).padStart(2, '0');
        const quoteFilename = `batch${batchNum}-03-quote-${slideNum}.png`;
        const quotePath = join(OUTPUT_DIR, quoteFilename);
        const quotePng = await generatePng(quoteElement, fonts, dimensions);
        await writeFile(quotePath, quotePng);
        success(`[3.${i + 1}] ${quoteFilename}`);
        totalCards++;

        carouselImages.push({
          path: quotePath,
          filename: quoteFilename,
          type: 'quote',
          metadata: quoteMeta,
          isCarouselPart: true,
          carouselIndex: i,
          carouselTotal: batch.quotes.length,
        });
      }

      postsToPublish.push({
        type: 'carousel',
        templateType: 'quote',
        images: carouselImages,
        metadata: quoteMeta,
        batchIdx,
        postIdx: postIdxInBatch++,
      });
    }
  }

  return totalCards;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function run(args: string[], publishMode = false): Promise<void> {
  const { flags } = parseFlags(args);
  const dryRunMode = flags.get('dry-run') === true;
  const lastN = flags.has('last') ? parseInt(flags.get('last') as string, 10) : undefined;
  const allMode = flags.get('all') === true;

  title('instagram batch generator');
  print(`format: ${FORMAT} (${dimensions.width}×${dimensions.height})`);
  print(`mode: ${publishMode ? 'generate + publish' : dryRunMode ? 'dry run' : 'generate only'}`);
  blank();

  // Load Buffer config if needed
  let bufferConfig: BufferConfig | undefined;
  if (publishMode || dryRunMode) {
    try {
      bufferConfig = loadBufferConfig();
      success('Buffer config loaded');
      blank();
    } catch (err) {
      error((err as Error).message);
      print('Add BUFFER_API_KEY and BUFFER_CHANNEL_ID to .env to enable publishing.');
      blank();
      if (publishMode) process.exit(1);
    }
  }

  // Load batch queue
  print('loading batch queue...');
  let queue: BatchQueue;
  try {
    queue = await loadBatchQueue();
    success(`${queue.entries.length} entries in queue`);
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }

  // Load content
  print('loading content...');
  const [journalEntries, ahoraEntries, published] = await Promise.all([
    loadJournalEntries(),
    loadAhoraEntries(),
    findPublishedEntries(),
  ]);
  success(`${journalEntries.size} journal entries, ${ahoraEntries.size} ahora dispatches`);
  muted(`${published.length} already published`);
  blank();

  // Filter to unpublished entries
  const unpublished = queue.entries.filter(
    entry => !isEntryPublished(entry, published)
  );

  if (unpublished.length === 0) {
    success('All entries have been published!');
    blank();
    return;
  }

  // Apply --last or --all
  let toGenerate: QueueEntry[];
  if (allMode) {
    toGenerate = unpublished;
    print(`Generating all ${unpublished.length} unpublished entries`);
  } else if (lastN !== undefined) {
    if (lastN > unpublished.length) {
      warning(`Requested ${lastN} entries but only ${unpublished.length} unpublished`);
    }
    toGenerate = unpublished.slice(-Math.min(lastN, unpublished.length));
    print(`Generating last ${toGenerate.length} of ${unpublished.length} unpublished entries`);
  } else {
    // Default: show what's available and exit
    print(`${unpublished.length} unpublished entries:`);
    blank();
    for (const entry of unpublished) {
      if (isJournalEntry(entry)) {
        muted(`  - ${entry.slug} (${entry.quotes.length} quotes)`);
      } else {
        muted(`  - status: ${entry.ahoraDate}`);
      }
    }
    blank();
    print('Use --last=N or --all to generate.');
    blank();
    return;
  }
  blank();

  // Resolve entries to batches
  const batches: ResolvedBatch[] = [];
  for (const entry of toGenerate) {
    const resolved = resolveQueueEntry(entry, journalEntries, ahoraEntries);
    if (resolved) {
      batches.push(resolved);
    }
  }

  if (batches.length === 0) {
    error('No valid batches to generate.');
    process.exit(1);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  print('loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  let totalCards = 0;
  const postsToPublish: PostToPublish[] = [];

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchNum = batchIdx + 1;
    const batchLabel = batch.journal?.title || `status ${batch.ahora?.dateStr}`;

    blank();
    divider();
    print(`Batch ${batchNum}: ${batchLabel}`);
    divider();
    blank();

    const cards = await generateBatch(batch, batchIdx, fonts, postsToPublish);
    totalCards += cards;
  }

  blank();
  success(`generated ${totalCards} cards in ${OUTPUT_DIR}`);
  blank();

  // Summary
  print('Post sequence:');
  blank();
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const num = i + 1;
    const label = batch.journal?.title || `status ${batch.ahora?.dateStr}`;
    print(`Batch ${num}: "${label}"`);

    if (batch.ahora) {
      muted(`  - status-${batch.ahora.dateStr}.png`);
    }
    if (batch.journal) {
      muted(`  - title-${batch.journal.slug}.png`);
      if (batch.quotes) {
        muted(`  - quote carousel (${batch.quotes.length} slides)`);
      }
    }
    blank();
  }

  // Publishing
  if ((publishMode || dryRunMode) && bufferConfig) {
    divider();
    print('Publishing to Buffer');
    divider();
    blank();

    for (const post of postsToPublish) {
      const batchNum = post.batchIdx + 1;
      const postNum = post.postIdx + 1;
      print(`Batch ${batchNum}, Post ${postNum} (${post.templateType}, ${post.type}):`);
      try {
        await publishPost(post, bufferConfig, dryRunMode);
      } catch (err) {
        error(`Failed: ${(err as Error).message}`);
      }
      blank();
    }

    success('publishing complete');
    blank();
  }
}
