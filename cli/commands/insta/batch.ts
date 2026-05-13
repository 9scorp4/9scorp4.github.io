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

import { mkdir, writeFile } from 'node:fs/promises';
import {
  loadFonts,
} from '../../../src/lib/shared-image-utils.ts';
import {
  INSTA_DIMENSIONS,
  type InstaFormat,
} from '../../../src/lib/insta-templates.tsx';
import {
  generateCaption,
  createPostMetadata,
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
import { getProjectRoot, getOutputDir, parseFlags } from '../../lib/cli-utils.ts';
import {
  loadJournalEntriesMap,
  loadAhoraEntriesMap,
  type JournalEntry,
  type AhoraEntry,
} from '../../lib/content-loaders.ts';
import {
  loadBatchQueue,
  findPublishedEntries,
  isEntryPublished,
  isJournalEntry,
  type QueueEntry,
} from '../../lib/batch-queue.ts';
import {
  getScheduleTime,
  getNextAvailableSlot,
} from '../../lib/insta-publisher.ts';
import {
  generateBatch,
  type ResolvedBatch,
  type PostToPublish,
} from '../../lib/batch-generator.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();

const FORMAT: InstaFormat = 'square';
const dimensions = INSTA_DIMENSIONS[FORMAT];

// ─────────────────────────────────────────────────────────────
// Batch resolution
// ─────────────────────────────────────────────────────────────

function matchAhoraToJournal(
  slug: string,
  ahoraEntries: Map<string, AhoraEntry>
): AhoraEntry | undefined {
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
      metalogue: entry.metalogue,
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

async function publishPost(
  post: PostToPublish,
  bufferConfig: BufferConfig,
  scheduledAt: Date,
  dryRun: boolean
): Promise<void> {
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
  let queue;
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
    loadJournalEntriesMap(),
    loadAhoraEntriesMap(),
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
      if (batch.metalogue && batch.journal.type === 'diptych') {
        const slideCount = Math.ceil(batch.metalogue.length / 3);
        muted(`  - metalogue carousel (${slideCount} slide${slideCount > 1 ? 's' : ''})`);
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

    // Fetch queue and find next available slot
    print('checking Buffer queue...');
    let nextSlot: Date;
    try {
      nextSlot = await getNextAvailableSlot(bufferConfig);
      success(`next available slot: ${formatScheduledTime(nextSlot)}`);
    } catch (err) {
      error(`Failed to fetch queue: ${(err as Error).message}`);
      print('Falling back to tomorrow 9 AM');
      nextSlot = new Date();
      nextSlot.setDate(nextSlot.getDate() + 1);
      nextSlot.setHours(9, 0, 0, 0);
    }
    blank();

    for (let i = 0; i < postsToPublish.length; i++) {
      const post = postsToPublish[i];
      const batchNum = post.batchIdx + 1;
      const postNum = post.postIdx + 1;
      const scheduledAt = getScheduleTime(nextSlot, i);
      print(`Batch ${batchNum}, Post ${postNum} (${post.templateType}, ${post.type}):`);
      try {
        await publishPost(post, bufferConfig, scheduledAt, dryRunMode);
      } catch (err) {
        error(`Failed: ${(err as Error).message}`);
      }
      blank();
    }

    success('publishing complete');
    blank();
  }
}
