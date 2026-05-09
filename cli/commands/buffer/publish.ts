/**
 * Buffer publish command
 *
 * Interactive mode for publishing existing images to Instagram via Buffer.
 */

import { select, input } from '@inquirer/prompts';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { uploadToR2 } from '../../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../../../src/lib/buffer-client.ts';
import type { SavedPostMetadata } from '../../../src/lib/insta-captions.ts';
import { title, print, success, error, muted, blank } from '../../lib/cli-style.ts';
import { getOutputDir, parseFlags } from '../../lib/cli-utils.ts';

const OUTPUT_DIR = getOutputDir();

// ─────────────────────────────────────────────────────────────
// Image discovery
// ─────────────────────────────────────────────────────────────

interface DiscoveredImage {
  path: string;
  filename: string;
  metadata?: SavedPostMetadata;
  modifiedAt: Date;
}

async function discoverImages(): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = [];

  try {
    const files = await readdir(OUTPUT_DIR);

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const imagePath = join(OUTPUT_DIR, file);
      const imageStat = await stat(imagePath);

      let metadata: SavedPostMetadata | undefined;
      try {
        const metaPath = imagePath.replace(/\.png$/, '.json');
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

  print('Uploading image to R2...');
  const imageUrl = await uploadToR2(imagePath);
  success(`Uploaded: ${imageUrl}`);

  print('Creating post on Buffer...');
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
  success(`Scheduled! Post ID: ${result.id}`);
  print(`Time: ${timeStr}`);
  blank();
}

// ─────────────────────────────────────────────────────────────
// Interactive mode
// ─────────────────────────────────────────────────────────────

async function interactiveMode(): Promise<void> {
  title('buffer publisher (interactive)');

  const images = await discoverImages();
  if (images.length === 0) {
    muted('No images found in insta-output/');
    print('Run `jardin insta` to generate some first.');
    blank();
    return;
  }

  const unpublished = images.filter((img) => !img.metadata?.published);
  const showAll = unpublished.length === 0;
  const displayImages = showAll ? images : unpublished;

  if (!showAll && unpublished.length < images.length) {
    muted(`Found ${unpublished.length} unpublished, ${images.length - unpublished.length} already published.`);
    blank();
  }

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

  const defaultCaption = image.metadata?.caption || '';
  const caption = await input({
    message: 'Caption:',
    default: defaultCaption,
  });

  const defaultHashtags = image.metadata?.hashtags || '';
  const hashtags = await input({
    message: 'Hashtags (first comment):',
    default: defaultHashtags,
  });

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
    muted('Cancelled.');
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

  await publishImage(image.path, caption, scheduledAt, hashtags);
}

// ─────────────────────────────────────────────────────────────
// Direct mode
// ─────────────────────────────────────────────────────────────

async function directMode(imagePath: string, flags: Map<string, string | boolean>): Promise<void> {
  title('buffer publisher');

  try {
    await stat(imagePath);
  } catch {
    error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  let caption = flags.get('caption') as string | undefined;
  if (!caption) {
    caption = await input({ message: 'Caption:' });
  }

  let scheduledAt: Date | undefined;
  const scheduleArg = flags.get('schedule') as string | undefined;
  const now = flags.get('now') as boolean | undefined;

  if (scheduleArg) {
    scheduledAt = parseLocalTime(scheduleArg);
  } else if (!now) {
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
      const customTime = await input({ message: 'Enter date/time (YYYY-MM-DD HH:MM):' });
      scheduledAt = parseLocalTime(customTime);
    } else if (scheduleChoice !== 'now') {
      scheduledAt = new Date(scheduleChoice);
    }
  }

  await publishImage(imagePath, caption, scheduledAt);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function run(args: string[]): Promise<void> {
  const { flags, positional } = parseFlags(args);

  if (flags.get('help') || flags.get('h')) {
    // Help is handled by the router
    return;
  }

  if (positional.length > 0) {
    await directMode(positional[0], flags);
    return;
  }

  await interactiveMode();
}
