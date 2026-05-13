/**
 * Content loading utilities for CLI commands.
 *
 * Unified content loaders for journal entries, ahora dispatches, and specimens.
 * Used by generate.ts, batch.ts, and other CLI commands.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import * as yaml from 'yaml';
import { parseLocalDate, parseFrontmatter, extractBody, getContentDir } from './cli-utils.ts';

const CONTENT_DIR = getContentDir();

/** Minimum chars for a paragraph to be quote-worthy */
const MIN_PARAGRAPH_LENGTH = 50;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface JournalEntry {
  slug: string;
  title: string;
  titleSecondary?: string;
  date: Date;
  type: 'article' | 'diptych';
  draft: boolean;
}

export interface AhoraEntry {
  date: Date;
  dateStr: string;
  temperatura?: string;
  escuchando?: string;
  cultivando?: string;
  articuloNuevo?: string[];
  body?: string;
}

export interface Specimen {
  id: string;
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  description: string;
  series?: string;
  seriesIndex?: number;
}

// ─────────────────────────────────────────────────────────────
// Text processing
// ─────────────────────────────────────────────────────────────

/**
 * Strip markdown formatting from text.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Extract paragraphs from markdown body suitable for quotes.
 */
export function extractParagraphs(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map(p => stripMarkdown(p.replace(/\n/g, ' ').trim()))
    .filter(p => {
      if (!p || p === '---') return false;
      if (p.length < MIN_PARAGRAPH_LENGTH) return false;
      if (p.startsWith('#')) return false;
      return true;
    });
}

/**
 * Format escuchando field from frontmatter.
 * Handles both array of track objects and string format.
 */
export function formatEscuchando(fm: Record<string, unknown>): string | undefined {
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

// ─────────────────────────────────────────────────────────────
// Journal entries
// ─────────────────────────────────────────────────────────────

/**
 * Load all journal entries as a sorted array (newest first).
 */
export async function loadJournalEntries(): Promise<JournalEntry[]> {
  const journalDir = join(CONTENT_DIR, 'journal');
  const entries: JournalEntry[] = [];

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
          entries.push({
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

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Load all journal entries as a Map keyed by slug.
 */
export async function loadJournalEntriesMap(): Promise<Map<string, JournalEntry>> {
  const entries = await loadJournalEntries();
  const map = new Map<string, JournalEntry>();
  for (const entry of entries) {
    map.set(entry.slug, entry);
  }
  return map;
}

/**
 * Load the body content of a journal entry.
 * Tries _article.md first (for diptychs), falls back to index.md.
 */
export async function loadJournalBody(slug: string): Promise<string> {
  const articlePath = join(CONTENT_DIR, 'journal', slug, '_article.md');
  try {
    return await readFile(articlePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      const indexPath = join(CONTENT_DIR, 'journal', slug, 'index.md');
      const content = await readFile(indexPath, 'utf-8');
      return extractBody(content);
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// Ahora entries
// ─────────────────────────────────────────────────────────────

/**
 * Load all ahora entries as a sorted array (newest first).
 */
export async function loadAhoraEntries(): Promise<AhoraEntry[]> {
  const ahoraDir = join(CONTENT_DIR, 'ahora');
  const entries: AhoraEntry[] = [];

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

    entries.push({
      date: parseLocalDate(dateStr),
      dateStr,
      temperatura,
      escuchando,
      cultivando,
      articuloNuevo,
      body,
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Load all ahora entries as a Map keyed by date string (YYYY-MM-DD).
 */
export async function loadAhoraEntriesMap(): Promise<Map<string, AhoraEntry>> {
  const entries = await loadAhoraEntries();
  const map = new Map<string, AhoraEntry>();
  for (const entry of entries) {
    map.set(entry.dateStr, entry);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// Specimens
// ─────────────────────────────────────────────────────────────

/**
 * Load all specimens from YAML files.
 */
export async function loadSpecimens(): Promise<Specimen[]> {
  const specDir = join(CONTENT_DIR, 'specimens');
  const specimens: Specimen[] = [];

  let files: string[];
  try {
    files = await readdir(specDir);
  } catch {
    return specimens;
  }

  for (const file of files) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    const content = await readFile(join(specDir, file), 'utf-8');
    const data = yaml.parse(content) as Specimen;
    specimens.push(data);
  }

  return specimens;
}
