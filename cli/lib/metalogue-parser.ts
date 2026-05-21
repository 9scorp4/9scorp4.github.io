/**
 * Metalogue content loading and parsing utilities.
 *
 * Parses speaker/line exchanges from _metalogue.md files
 * and groups them into carousel slides.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { MetalogueFragment } from '../../src/lib/insta-templates.tsx';
import { parseFrontmatter, parseLocalDate, getContentDir } from './cli-utils.ts';
import { extractSlug } from '../../src/lib/journal-slug.ts';

const CONTENT_DIR = getContentDir();

/** Fragments per carousel slide */
export const FRAGMENTS_PER_SLIDE = 3;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DiptychEntry {
  slug: string;           // Clean slug (lo-que-cruza)
  folderName: string;     // Full folder name (01_lo-que-cruza)
  title: string;
  titleSecondary?: string;
  date: Date;
  hasMetalogue: boolean;
}

// ─────────────────────────────────────────────────────────────
// Content loading
// ─────────────────────────────────────────────────────────────

export async function loadDiptychEntries(): Promise<DiptychEntry[]> {
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
            slug: extractSlug(item),
            folderName: item,
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

// ─────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────

/**
 * Parse metalogue markdown into speaker/line fragments.
 *
 * Expected format:
 *   SPEAKER: Line text here
 *   ANOTHER: Another line
 *   ---
 *   (scene break, ignored)
 */
export function parseMetalogueContent(content: string): MetalogueFragment[] {
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

/**
 * Load metalogue content from a journal entry folder.
 * @param folderName - The full folder name (e.g., "01_lo-que-cruza")
 */
export async function loadMetalogueContent(folderName: string): Promise<MetalogueFragment[]> {
  const metaloguePath = join(CONTENT_DIR, 'journal', folderName, '_metalogue.md');
  const content = await readFile(metaloguePath, 'utf-8');
  return parseMetalogueContent(content);
}

// ─────────────────────────────────────────────────────────────
// Slide grouping
// ─────────────────────────────────────────────────────────────

export function groupIntoSlides(fragments: MetalogueFragment[]): MetalogueFragment[][] {
  const slides: MetalogueFragment[][] = [];

  for (let i = 0; i < fragments.length; i += FRAGMENTS_PER_SLIDE) {
    slides.push(fragments.slice(i, i + FRAGMENTS_PER_SLIDE));
  }

  return slides;
}
