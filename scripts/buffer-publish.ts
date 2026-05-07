#!/usr/bin/env npx tsx
/**
 * Standalone CLI for publishing existing images to Instagram via Buffer.
 * Use this to publish images that were generated without the --publish flag.
 *
 * Usage:
 *   npx tsx scripts/buffer-publish.ts --interactive       # Interactive mode
 *   npx tsx scripts/buffer-publish.ts --channels          # List connected channels
 *   npx tsx scripts/buffer-publish.ts path/to/image.png   # Publish specific image
 *
 * Options:
 *   --caption "text"     Custom caption (skips prompt)
 *   --schedule "time"    Schedule time in America/Montreal (e.g., "2026-05-08 14:30")
 *   --now                Publish immediately (add to queue)
 */

import 'dotenv/config';
import { select, confirm, input } from '@inquirer/prompts';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadToR2 } from '../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  getChannels,
  createPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../src/lib/buffer-client.ts';
import type { SavedPostMetadata } from '../src/lib/insta-captions.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'insta-output');

// ─────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────

interface CliArgs {
  interactive: boolean;
  channels: boolean;
  imagePath?: string;
  caption?: string;
  schedule?: string;
  now: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    interactive: false,
    channels: false,
    now: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--interactive' || arg === '-i') {
      result.interactive = true;
    } else if (arg === '--channels') {
      result.channels = true;
    } else if (arg === '--caption') {
      result.caption = args[++i];
    } else if (arg === '--schedule') {
      result.schedule = args[++i];
    } else if (arg === '--now') {
      result.now = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (!arg.startsWith('-')) {
      result.imagePath = arg;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Image discovery
// ─────────────────────────────────────────────────────────────

interface DiscoveredImage {
  path: string;
  filename: string;
  metadata?: SavedPostMetadata;
  modifiedAt: Date;
}

/**
 * Find all PNG images in the output directory.
 * Optionally loads associated metadata JSON files.
 */
async function discoverImages(): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = [];

  try {
    const files = await readdir(OUTPUT_DIR);

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const imagePath = join(OUTPUT_DIR, file);
      const imageStat = await stat(imagePath);

      // Try to load metadata
      const metaPath = imagePath.replace(/\.png$/, '.json');
      let metadata: SavedPostMetadata | undefined;
      try {
        const metaContent = await readFile(metaPath, 'utf-8');
        metadata = JSON.parse(metaContent) as SavedPostMetadata;
      } catch {
        // No metadata file
      }

      images.push({
        path: imagePath,
        filename: file,
        metadata,
        modifiedAt: imageStat.mtime,
      });
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  // Sort by modification time, newest first
  return images.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

// ─────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────

async function publishImage(
  imagePath: string,
  caption: string,
  scheduledAt?: Date,
  hashtags?: string
): Promise<void> {
  const config = loadBufferConfig();

  // Upload to R2
  console.log('  Uploading image to R2...');
  const imageUrl = await uploadToR2(imagePath);
  console.log(`  Uploaded: ${imageUrl}`);

  // Create post
  console.log('  Creating post on Buffer...');
  const result = await createPost(config.apiKey, {
    channelId: config.channelId,
    text: caption,
    imageUrl,
    altText: `Instagram post: ${basename(imagePath)}`,
    scheduledAt,
    firstComment: hashtags || undefined,
  });

  const timeStr = scheduledAt
    ? formatScheduledTime(scheduledAt)
    : 'added to queue';
  console.log(`  ✓ Scheduled! Post ID: ${result.id}`);
  console.log(`  Time: ${timeStr}\n`);
}

// ─────────────────────────────────────────────────────────────
// Interactive mode
// ─────────────────────────────────────────────────────────────

async function interactiveMode(): Promise<void> {
  console.log('\n  ✦ buffer publisher (interactive)\n');

  const images = await discoverImages();
  if (images.length === 0) {
    console.log('  No images found in insta-output/');
    console.log('  Run `npm run insta` to generate some first.\n');
    return;
  }

  // Filter to unpublished images first, then all
  const unpublished = images.filter((img) => !img.metadata?.published);
  const showAll = unpublished.length === 0;
  const displayImages = showAll ? images : unpublished;

  if (!showAll && unpublished.length < images.length) {
    console.log(`  Found ${unpublished.length} unpublished, ${images.length - unpublished.length} already published.\n`);
  }

  // Select image
  const image = await select<DiscoveredImage>({
    message: 'Select image to publish:',
    choices: displayImages.map((img) => {
      const published = img.metadata?.published ? ' [published]' : '';
      const type = img.metadata?.templateType ? ` (${img.metadata.templateType})` : '';
      return {
        value: img,
        name: `${img.filename}${type}${published}`,
      };
    }),
  });

  // Caption
  const defaultCaption = image.metadata?.caption || '';
  const caption = await input({
    message: 'Caption:',
    default: defaultCaption,
  });

  // Hashtags
  const defaultHashtags = image.metadata?.hashtags || '';
  const hashtags = await input({
    message: 'Hashtags (first comment):',
    default: defaultHashtags,
  });

  // Schedule
  const scheduleOptions = getScheduleOptions();
  const scheduleChoice = await select<string>({
    message: 'When to publish? (America/Montreal)',
    choices: [
      ...scheduleOptions.map((opt) => ({
        value: opt.value ? opt.value.toISOString() : 'now',
        name: opt.label,
      })),
      { value: 'custom', name: 'Custom date/time...' },
      { value: 'skip', name: 'Cancel' },
    ],
  });

  if (scheduleChoice === 'skip') {
    console.log('  Cancelled.\n');
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

  await publishImage(image.path, caption, scheduledAt, hashtags);
}

// ─────────────────────────────────────────────────────────────
// Direct mode
// ─────────────────────────────────────────────────────────────

async function directMode(args: CliArgs): Promise<void> {
  if (!args.imagePath) {
    console.error('Error: No image path provided');
    process.exit(1);
  }

  console.log('\n  ✦ buffer publisher\n');

  // Check image exists
  try {
    await stat(args.imagePath);
  } catch {
    console.error(`Error: Image not found: ${args.imagePath}`);
    process.exit(1);
  }

  // Get caption
  let caption = args.caption;
  if (!caption) {
    caption = await input({
      message: 'Caption:',
    });
  }

  // Get schedule
  let scheduledAt: Date | undefined;
  if (args.schedule) {
    scheduledAt = parseLocalTime(args.schedule);
  } else if (!args.now) {
    const scheduleOptions = getScheduleOptions();
    const scheduleChoice = await select<string>({
      message: 'When to publish?',
      choices: [
        ...scheduleOptions.map((opt) => ({
          value: opt.value ? opt.value.toISOString() : 'now',
          name: opt.label,
        })),
        { value: 'custom', name: 'Custom date/time...' },
      ],
    });

    if (scheduleChoice === 'custom') {
      const customTime = await input({
        message: 'Enter date/time (YYYY-MM-DD HH:MM):',
      });
      scheduledAt = parseLocalTime(customTime);
    } else if (scheduleChoice !== 'now') {
      scheduledAt = new Date(scheduleChoice);
    }
  }

  await publishImage(args.imagePath, caption, scheduledAt);
}

// ─────────────────────────────────────────────────────────────
// List channels
// ─────────────────────────────────────────────────────────────

async function listChannels(): Promise<void> {
  console.log('\n  ✦ connected buffer channels\n');

  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    console.log('  Error: BUFFER_API_KEY not set in .env\n');
    return;
  }

  try {
    const channels = await getChannels(apiKey);

    if (channels.length === 0) {
      console.log('  No channels connected.');
      console.log('  Connect Instagram at buffer.com/channels\n');
      return;
    }

    console.log('  Channels:\n');
    for (const ch of channels) {
      const tag = ch.service === 'instagram' ? ' ← use this ID' : '';
      console.log(`    ${ch.service.padEnd(12)} ${ch.name.padEnd(20)} ${ch.id}${tag}`);
    }
    console.log('\n  Set BUFFER_CHANNEL_ID in .env to your Instagram channel ID.\n');
  } catch (err) {
    console.log(`  Error: ${(err as Error).message}\n`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    console.log(`
  ✦ buffer publisher

  Publish images to Instagram via Buffer.

  Usage:
    npx tsx scripts/buffer-publish.ts --interactive       Interactive mode
    npx tsx scripts/buffer-publish.ts --channels          List connected channels
    npx tsx scripts/buffer-publish.ts path/to/image.png   Publish specific image

  Options:
    --interactive, -i    Browse and publish from insta-output/
    --channels           List connected Buffer channels
    --caption "text"     Set caption (skips prompt)
    --schedule "time"    Schedule time (e.g., "2026-05-08 14:30")
    --now                Publish immediately (add to queue)
    --help, -h           Show this help

  Environment variables:
    BUFFER_API_KEY        Buffer API key (required)
    BUFFER_CHANNEL_ID     Buffer Instagram channel ID (required)
    CF_ACCOUNT_ID         Cloudflare account ID (for R2)
    R2_ACCESS_KEY_ID      R2 access key
    R2_SECRET_ACCESS_KEY  R2 secret key
    R2_BUCKET_NAME        R2 bucket name
    R2_PUBLIC_URL         R2 public URL
`);
    return;
  }

  if (args.channels) {
    await listChannels();
    return;
  }

  if (args.interactive) {
    await interactiveMode();
    return;
  }

  if (args.imagePath) {
    await directMode(args);
    return;
  }

  // Default to interactive
  await interactiveMode();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
