/**
 * Title matcher for cross-reference scanning.
 *
 * Matches entry titles (and secondary titles) in content.
 */

import type {
  LinkableEntry,
  SourceFile,
  LinkOpportunity,
  Collection,
} from '../../../lib/refs-types.ts';
import { findExistingWikilinks } from '../../../lib/refs-index.ts';

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a wikilink string.
 */
function generateWikilink(
  collection: Collection,
  slug: string,
  displayText: string,
  anchor?: string
): string {
  const fragment = anchor ? `#^${anchor}` : '';
  return `[[${collection}:${slug}${fragment}|${displayText}]]`;
}

/**
 * Find title matches in a source file.
 */
export function findTitleMatches(
  source: SourceFile,
  entries: LinkableEntry[]
): LinkOpportunity[] {
  const opportunities: LinkOpportunity[] = [];
  const lines = source.content.split('\n');
  const existingLinks = findExistingWikilinks(source.content);

  // Track first mentions per entry to avoid over-linking
  const firstMentions = new Set<string>();

  for (const entry of entries) {
    // Skip self-references
    if (entry.collection === source.collection && entry.slug === source.slug) {
      continue;
    }

    // Skip if already linked in this file
    const entryKey = `${entry.collection}:${entry.slug}`;
    if (existingLinks.has(entryKey)) {
      continue;
    }

    // Build title patterns to search for
    const patterns: Array<{
      pattern: RegExp;
      confidence: number;
      matchType: 'exact-title' | 'secondary-title' | 'partial-title';
      displayText: string;
    }> = [];

    // Exact title match (case-insensitive, word boundaries)
    if (entry.title && entry.title.length >= 4) {
      patterns.push({
        pattern: new RegExp(`\\b${escapeRegex(entry.title)}\\b`, 'gi'),
        confidence: 95,
        matchType: 'exact-title',
        displayText: entry.title,
      });
    }

    // Secondary title match (English equivalent)
    if (entry.titleSecondary && entry.titleSecondary.length >= 4) {
      patterns.push({
        pattern: new RegExp(`\\b${escapeRegex(entry.titleSecondary)}\\b`, 'gi'),
        confidence: 90,
        matchType: 'secondary-title',
        displayText: entry.titleSecondary,
      });
    }

    // For cultivations and specimens, also match name
    if (
      (entry.collection === 'cultivation' || entry.collection === 'specimen') &&
      entry.title.length >= 4
    ) {
      // Already handled by title match above
    }

    // Search for matches
    for (const { pattern, confidence, matchType, displayText } of patterns) {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        // Skip lines that are already wikilinks or inside code blocks
        if (line.includes('[[') || line.startsWith('```') || line.startsWith('    ')) {
          continue;
        }

        // Skip headings for exact matches (usually not good link targets)
        if (line.startsWith('#') && matchType === 'exact-title') {
          continue;
        }

        let match;
        while ((match = pattern.exec(line)) !== null) {
          const matchedText = match[0];

          // Check if this is inside an existing markdown link [text](url)
          const beforeMatch = line.slice(0, match.index);
          const afterMatch = line.slice(match.index + matchedText.length);
          if (beforeMatch.match(/\[[^\]]*$/) && afterMatch.match(/^\][^\[]/)) {
            continue;
          }

          // First mention preference: only suggest once per entry per source
          if (firstMentions.has(entryKey)) {
            continue;
          }
          firstMentions.add(entryKey);

          opportunities.push({
            sourceCollection: source.collection,
            sourceSlug: source.slug,
            sourceFile: source.filePath,
            sourceLine: lineIndex + 1,
            sourceContext: line.trim(),

            targetCollection: entry.collection,
            targetSlug: entry.slug,

            matchedText,
            displayText: matchedText, // Use the actual matched text as display
            confidence,
            matchType,

            wikilink: generateWikilink(entry.collection, entry.slug, matchedText),
          });

          // Only take first match per line per pattern
          break;
        }

        // Reset regex lastIndex
        pattern.lastIndex = 0;
      }
    }
  }

  return opportunities;
}
