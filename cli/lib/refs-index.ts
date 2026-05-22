/**
 * Reference index builder for cross-reference scanning.
 *
 * Builds an index of all linkable content from:
 * - journal entries (with anchors)
 * - ahora dispatches
 * - specimens
 * - cultivations
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import * as yaml from 'yaml';
import { parseFrontmatter, extractBody, getContentDir } from './cli-utils.ts';
import { extractSlug } from '../../src/lib/journal-slug.ts';
import type { LinkableEntry, BlockAnchor, SourceFile, Collection } from './refs-types.ts';

const CONTENT_DIR = getContentDir();

// Pattern to extract block anchors: ^anchor-id at end of paragraph
const ANCHOR_PATTERN = /\^([a-z0-9-]+)\s*$/gm;

// Pattern to detect existing wikilinks
const EXISTING_WIKILINK_PATTERN = /\[\[(\w+):([^\]#|]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

/**
 * Extract block anchors from markdown content.
 */
function extractAnchors(content: string): BlockAnchor[] {
  const anchors: BlockAnchor[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/\^([a-z0-9-]+)\s*$/);
    if (match) {
      // Get context: strip the anchor marker and trim
      const context = line.replace(/\s*\^[a-z0-9-]+\s*$/, '').trim();
      anchors.push({
        id: match[1],
        lineNumber: i + 1,
        context: context.slice(0, 100), // First 100 chars for context
      });
    }
  }

  return anchors;
}

/**
 * Find existing wikilinks in content to avoid suggesting duplicates.
 */
export function findExistingWikilinks(content: string): Set<string> {
  const existing = new Set<string>();
  let match;

  while ((match = EXISTING_WIKILINK_PATTERN.exec(content)) !== null) {
    const [, collection, slug] = match;
    existing.add(`${collection}:${slug}`);
  }

  return existing;
}

/**
 * Load all journal entries as linkable entries.
 */
async function loadJournalIndex(): Promise<LinkableEntry[]> {
  const journalDir = join(CONTENT_DIR, 'journal');
  const entries: LinkableEntry[] = [];

  let items: string[];
  try {
    items = await readdir(journalDir);
  } catch {
    return entries;
  }

  for (const item of items) {
    const itemPath = join(journalDir, item);
    const itemStat = await stat(itemPath);

    if (!itemStat.isDirectory()) continue;

    const indexPath = join(itemPath, 'index.md');
    try {
      const indexContent = await readFile(indexPath, 'utf-8');
      const fm = parseFrontmatter(indexContent);

      if (fm.draft) continue;

      const slug = extractSlug(item);
      const allFiles = [indexPath];
      let primaryFile = indexPath;
      let primaryContent = extractBody(indexContent);

      // Check for _article.md (diptych structure)
      const articlePath = join(itemPath, '_article.md');
      try {
        const articleContent = await readFile(articlePath, 'utf-8');
        allFiles.push(articlePath);
        primaryFile = articlePath;
        primaryContent = articleContent;
      } catch {
        // Not a diptych, use index.md body
      }

      // Check for _metalogue.md
      const metaloguePath = join(itemPath, '_metalogue.md');
      try {
        await stat(metaloguePath);
        allFiles.push(metaloguePath);
      } catch {
        // No metalogue
      }

      // Extract anchors from primary content
      const anchors = extractAnchors(primaryContent);

      entries.push({
        collection: 'journal',
        slug,
        folderName: item,
        title: fm.title as string,
        titleSecondary: fm.title_secondary as string | undefined,
        anchors,
        filePath: primaryFile,
        allFiles,
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  return entries;
}

/**
 * Load all ahora dispatches as linkable entries.
 */
async function loadAhoraIndex(): Promise<LinkableEntry[]> {
  const ahoraDir = join(CONTENT_DIR, 'ahora');
  const entries: LinkableEntry[] = [];

  let files: string[];
  try {
    files = await readdir(ahoraDir);
  } catch {
    return entries;
  }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = join(ahoraDir, file);
    const content = await readFile(filePath, 'utf-8');
    const fm = parseFrontmatter(content);
    const body = extractBody(content);
    const dateStr = fm.date as string;
    const slug = dateStr; // Use date as slug for ahora

    // Ahora entries use date as title
    entries.push({
      collection: 'ahora',
      slug,
      title: dateStr,
      anchors: extractAnchors(body),
      filePath,
      allFiles: [filePath],
    });
  }

  return entries;
}

/**
 * Load all specimens as linkable entries.
 */
async function loadSpecimensIndex(): Promise<LinkableEntry[]> {
  const specDir = join(CONTENT_DIR, 'specimens');
  const entries: LinkableEntry[] = [];

  let files: string[];
  try {
    files = await readdir(specDir);
  } catch {
    return entries;
  }

  for (const file of files) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;

    const filePath = join(specDir, file);
    const content = await readFile(filePath, 'utf-8');
    const data = yaml.parse(content) as {
      id: string;
      name: string;
      description?: string;
    };

    entries.push({
      collection: 'specimen',
      slug: data.id,
      title: data.name,
      anchors: [], // Specimens don't have anchors
      filePath,
      allFiles: [filePath],
    });
  }

  return entries;
}

/**
 * Load all cultivations as linkable entries.
 */
async function loadCultivationsIndex(): Promise<LinkableEntry[]> {
  const cultDir = join(CONTENT_DIR, 'cultivations');
  const entries: LinkableEntry[] = [];

  let files: string[];
  try {
    files = await readdir(cultDir);
  } catch {
    return entries;
  }

  for (const file of files) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;

    const filePath = join(cultDir, file);
    const content = await readFile(filePath, 'utf-8');
    const data = yaml.parse(content) as {
      slug: string;
      name: string;
      description?: string;
    };

    entries.push({
      collection: 'cultivation',
      slug: data.slug,
      title: data.name,
      anchors: [], // Cultivations don't have anchors
      filePath,
      allFiles: [filePath],
    });
  }

  return entries;
}

/**
 * Build the complete reference index from all collections.
 */
export async function buildRefsIndex(): Promise<LinkableEntry[]> {
  const [journal, ahora, specimens, cultivations] = await Promise.all([
    loadJournalIndex(),
    loadAhoraIndex(),
    loadSpecimensIndex(),
    loadCultivationsIndex(),
  ]);

  return [...journal, ...ahora, ...specimens, ...cultivations];
}

/**
 * Load all source files that should be scanned for opportunities.
 * Returns content for journal articles, metalogues, and ahora bodies.
 */
export async function loadSourceFiles(
  entries: LinkableEntry[],
  focusEntry?: string
): Promise<SourceFile[]> {
  const sources: SourceFile[] = [];

  for (const entry of entries) {
    // Filter by focus entry if specified
    if (focusEntry) {
      const [col, slug] = focusEntry.split(':');
      if (entry.collection !== col || entry.slug !== slug) continue;
    }

    // Only scan journal and ahora for opportunities
    // (specimens and cultivations are targets only, not sources)
    if (entry.collection !== 'journal' && entry.collection !== 'ahora') {
      continue;
    }

    for (const filePath of entry.allFiles) {
      try {
        let content = await readFile(filePath, 'utf-8');

        // For index.md files with frontmatter, extract the body
        if (basename(filePath) === 'index.md') {
          content = extractBody(content);
        }

        // Skip if content is too short (likely just frontmatter)
        if (content.trim().length < 50) continue;

        sources.push({
          collection: entry.collection,
          slug: entry.slug,
          filePath,
          content,
        });
      } catch {
        // File not readable, skip
      }
    }
  }

  return sources;
}

/**
 * Get entries by collection for quick lookup.
 */
export function indexByCollection(
  entries: LinkableEntry[]
): Map<Collection, Map<string, LinkableEntry>> {
  const index = new Map<Collection, Map<string, LinkableEntry>>();

  for (const entry of entries) {
    if (!index.has(entry.collection)) {
      index.set(entry.collection, new Map());
    }
    index.get(entry.collection)!.set(entry.slug, entry);
  }

  return index;
}
