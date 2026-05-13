/**
 * Metalogue carousel publishing to Buffer.
 *
 * Handles R2 upload and Buffer scheduling for metalogue carousels.
 */

import { writeFile } from 'node:fs/promises';
import { select, input } from '@inquirer/prompts';
import {
  generateCaption,
  createPostMetadata,
  type MetalogueMetadata,
  type SavedPostMetadata,
} from '../../src/lib/insta-captions.ts';
import { uploadToR2 } from '../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createCarouselPost,
  createPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
} from '../../src/lib/buffer-client.ts';
import { title, print, success, error, muted, blank } from './cli-style.ts';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GeneratedCarousel {
  imagePaths: string[];
  metadata: MetalogueMetadata;
}

// ─────────────────────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────────────────────

export async function publishCarouselToBuffer(carousel: GeneratedCarousel): Promise<void> {
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
