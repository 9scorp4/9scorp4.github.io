/**
 * Instagram publishing utilities for Buffer integration.
 *
 * Provides interactive and batch publishing functionality.
 */

import { select, input } from '@inquirer/prompts';
import { writeFile } from 'node:fs/promises';
import { uploadToR2 } from '../../src/lib/r2-client.ts';
import {
  loadBufferConfig,
  createPost,
  createCarouselPost,
  formatScheduledTime,
  parseLocalTime,
  getScheduleOptions,
  getOrganizationId,
  getScheduledPosts,
  type BufferConfig,
} from '../../src/lib/buffer-client.ts';
import {
  generateCaption,
  createPostMetadata,
  type TemplateType,
  type ContentMetadata,
  type SavedPostMetadata,
} from '../../src/lib/insta-captions.ts';
import { title, print, success, error, muted, blank } from './cli-style.ts';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GeneratedPost {
  templateType: TemplateType;
  imagePath: string;
  metadata: ContentMetadata;
}

export interface GeneratedCarousel {
  templateType: TemplateType;
  imagePaths: string[];
  metadata: ContentMetadata;
}

// ─────────────────────────────────────────────────────────────
// Interactive publishing (with prompts)
// ─────────────────────────────────────────────────────────────

/**
 * Publish a single post to Buffer with interactive prompts.
 */
export async function publishPostInteractive(post: GeneratedPost): Promise<void> {
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

/**
 * Publish a carousel to Buffer with interactive prompts.
 */
export async function publishCarouselInteractive(carousel: GeneratedCarousel): Promise<void> {
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
// Batch scheduling utilities
// ─────────────────────────────────────────────────────────────

/**
 * Calculate schedule time for a post based on the next available slot.
 * Time slots are 9 AM, 1 PM, 5 PM, 9 PM (4 slots per day, 4-hour spacing).
 */
export function getScheduleTime(baseTime: Date, postIndex: number): Date {
  const SLOTS_PER_DAY = 4;
  const SLOT_HOURS = [9, 13, 17, 21]; // 9 AM, 1 PM, 5 PM, 9 PM

  // Find base slot index (which slot in the day is baseTime?)
  const baseHour = baseTime.getHours();
  let baseSlotIndex = SLOT_HOURS.findIndex(h => h === baseHour);
  if (baseSlotIndex === -1) baseSlotIndex = 0; // Default to 9 AM slot

  // Calculate total slot offset
  const totalSlot = baseSlotIndex + postIndex;
  const daysOffset = Math.floor(totalSlot / SLOTS_PER_DAY);
  const slotInDay = totalSlot % SLOTS_PER_DAY;

  const scheduled = new Date(baseTime);
  scheduled.setDate(scheduled.getDate() + daysOffset);
  scheduled.setHours(SLOT_HOURS[slotInDay], 0, 0, 0);

  return scheduled;
}

/**
 * Calculate the next available scheduling slot based on existing Buffer queue.
 * Returns tomorrow 9 AM if queue is empty, otherwise 4 hours after latest queued post.
 */
export async function getNextAvailableSlot(bufferConfig: BufferConfig): Promise<Date> {
  const orgId = await getOrganizationId(bufferConfig.apiKey, bufferConfig.channelId);
  const queue = await getScheduledPosts(bufferConfig.apiKey, orgId, bufferConfig.channelId);

  if (queue.length === 0) {
    // Empty queue: start tomorrow 9 AM
    const nextSlot = new Date();
    nextSlot.setDate(nextSlot.getDate() + 1);
    nextSlot.setHours(9, 0, 0, 0);
    return nextSlot;
  }

  // Find latest scheduled time
  const latestDue = queue
    .map(p => new Date(p.dueAt))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  // Add 4 hours after latest
  const nextSlot = new Date(latestDue);
  nextSlot.setHours(nextSlot.getHours() + 4);

  // Roll to next day if past 9 PM
  if (nextSlot.getHours() > 21) {
    nextSlot.setDate(nextSlot.getDate() + 1);
    nextSlot.setHours(9, 0, 0, 0);
  }

  return nextSlot;
}
