/**
 * Batch queue loading and validation for Instagram card generation.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as yaml from 'yaml';
import type { SavedPostMetadata, TemplateType } from '../../src/lib/insta-captions.ts';
import { getProjectRoot, getOutputDir } from './cli-utils.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Entry from batch-queue.yaml: journal entry with quotes */
export interface JournalQueueEntry {
  slug: string;
  quotes: string[];
  metalogue?: Array<{ speaker: string; line: string }>;
}

/** Entry from batch-queue.yaml: status-only (ahora without journal) */
export interface StatusOnlyQueueEntry {
  ahoraDate: string;
}

export type QueueEntry = JournalQueueEntry | StatusOnlyQueueEntry;

export interface BatchQueue {
  entries: QueueEntry[];
}

/** Published entry info from metadata JSON */
export interface PublishedInfo {
  slug?: string;
  date?: string;
  templateType: TemplateType;
}

// ─────────────────────────────────────────────────────────────
// Type guards
// ─────────────────────────────────────────────────────────────

export function isJournalEntry(entry: QueueEntry): entry is JournalQueueEntry {
  return 'slug' in entry;
}

// ─────────────────────────────────────────────────────────────
// Queue loading
// ─────────────────────────────────────────────────────────────

/**
 * Load and validate batch queue from YAML.
 */
export async function loadBatchQueue(): Promise<BatchQueue> {
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
// Published detection
// ─────────────────────────────────────────────────────────────

/**
 * Scan output directory for published metadata files.
 */
export async function findPublishedEntries(): Promise<PublishedInfo[]> {
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
          const dateVal = (meta.metadata as { date: string | Date }).date;
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

/**
 * Check if a queue entry has already been published.
 */
export function isEntryPublished(
  entry: QueueEntry,
  published: PublishedInfo[]
): boolean {
  if (isJournalEntry(entry)) {
    // Check if title and quote cards are published for this slug
    const hasTitle = published.some(
      p => p.templateType === 'title' && p.slug === entry.slug
    );
    const hasQuote = published.some(
      p => p.templateType === 'quote' && p.slug === entry.slug
    );
    // If entry has metalogue, also check if metalogue is published
    const hasMetalogue = entry.metalogue
      ? published.some(p => p.templateType === 'metalogue' && p.slug === entry.slug)
      : true; // No metalogue required = consider fulfilled
    return hasTitle && hasQuote && hasMetalogue;
  } else {
    // Check if status card is published for this date
    return published.some(
      p => p.templateType === 'status' && p.date === entry.ahoraDate
    );
  }
}
