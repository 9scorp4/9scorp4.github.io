/**
 * resolve-wikilinks — runtime utility for transforming [[collection:slug]] syntax to HTML.
 *
 * Used for content that doesn't go through the remark pipeline (e.g., YAML descriptions).
 * Mirrors the logic in remark-wikilink.ts but outputs HTML strings.
 *
 * Syntax:
 *   [[journal:slug]]                    → /cuaderno/01_slug/
 *   [[journal:slug#heading-id]]         → /cuaderno/01_slug/#heading-id
 *   [[journal:slug#^anchor]]            → /cuaderno/01_slug/#anchor
 *   [[journal:slug#^anchor|text]]       → /cuaderno/01_slug/#anchor (with custom display text)
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractSlug } from './journal-slug.ts';

// Pattern: [[collection:slug]] or [[collection:slug#fragment]] or [[collection:slug#fragment|display]]
const WIKILINK_PATTERN = /\[\[(\w+):([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Build a lookup map from clean slugs to folder names.
 * Scans the journal directory once at module load.
 */
function buildJournalLookup(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const journalDir = join(process.cwd(), 'src', 'content', 'journal');
    for (const entry of readdirSync(journalDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        map.set(extractSlug(entry.name), entry.name);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read — return empty map
  }
  return map;
}

const journalFolders = buildJournalLookup();

// Resolution maps for each collection
// These mirror the paths in wikilink-resolver.ts
const COLLECTION_PATHS: Record<string, (slug: string) => string> = {
  journal: (slug) => `/cuaderno/${journalFolders.get(slug) ?? slug}/`,
  specimen: (id) => `/#${id}`,
  library: (name) => `/#library-${name}`,
};

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resolves wikilink syntax in a plain string, returning HTML.
 *
 * @param text - The input string potentially containing [[...]] wikilinks
 * @returns HTML string with wikilinks converted to <a> tags
 *
 * @example
 * resolveWikilinks("Read through [[journal:lo-que-corrige-el-mapa#^mind|Bateson's types]].")
 * // Returns: "Read through <a href=\"/cuaderno/lo-que-corrige-el-mapa/#mind\">Bateson's types</a>."
 */
export function resolveWikilinks(text: string): string {
  return text.replace(WIKILINK_PATTERN, (fullMatch, collection, slug, fragment, displayText) => {
    const pathFn = COLLECTION_PATHS[collection];

    if (!pathFn) {
      // Unknown collection — leave unchanged (will show as plain text)
      console.warn(`[resolve-wikilinks] Unknown collection: ${collection}`);
      return escapeHtml(fullMatch);
    }

    // Build the URL
    let url = pathFn(slug);
    if (fragment) {
      // Strip ^anchor prefix
      const cleanFragment = fragment.startsWith('^') ? fragment.slice(1) : fragment;
      url += `#${cleanFragment}`;
    }

    // Display text defaults to slug
    const linkText = displayText || slug;

    return `<a href="${escapeHtml(url)}">${escapeHtml(linkText)}</a>`;
  });
}

/**
 * Checks if a string contains any wikilink syntax.
 */
export function hasWikilinks(text: string): boolean {
  // Reset lastIndex since we use a global regex
  WIKILINK_PATTERN.lastIndex = 0;
  return WIKILINK_PATTERN.test(text);
}

export default resolveWikilinks;
