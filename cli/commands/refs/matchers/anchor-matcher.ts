/**
 * Anchor matcher for cross-reference scanning.
 *
 * Matches terms that correspond to block anchors (^anchor-id) in other entries.
 * Lower confidence than title matches since anchor IDs are abbreviated.
 */

import type {
  LinkableEntry,
  SourceFile,
  LinkOpportunity,
  Collection,
} from '../../../lib/refs-types.ts';
import { findExistingWikilinks } from '../../../lib/refs-index.ts';

/**
 * Convert anchor ID to searchable terms.
 * E.g., "four-failures" → ["four failures", "four-failures"]
 */
function anchorToTerms(anchorId: string): string[] {
  const terms: string[] = [];

  // Original with hyphens
  terms.push(anchorId);

  // With spaces instead of hyphens
  terms.push(anchorId.replace(/-/g, ' '));

  return terms;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a wikilink string with anchor.
 */
function generateWikilink(
  collection: Collection,
  slug: string,
  anchor: string,
  displayText: string
): string {
  return `[[${collection}:${slug}#^${anchor}|${displayText}]]`;
}

/**
 * Find anchor matches in a source file.
 */
export function findAnchorMatches(
  source: SourceFile,
  entries: LinkableEntry[]
): LinkOpportunity[] {
  const opportunities: LinkOpportunity[] = [];
  const lines = source.content.split('\n');
  const existingLinks = findExistingWikilinks(source.content);

  // Track matches to avoid duplicates
  const seenMatches = new Set<string>();

  for (const entry of entries) {
    // Skip self-references
    if (entry.collection === source.collection && entry.slug === source.slug) {
      continue;
    }

    // Skip entries without anchors
    if (entry.anchors.length === 0) {
      continue;
    }

    // Skip if already linked in this file (at any anchor)
    const entryKey = `${entry.collection}:${entry.slug}`;

    for (const anchor of entry.anchors) {
      // Skip very short anchor IDs (likely too generic)
      if (anchor.id.length < 5) continue;

      const terms = anchorToTerms(anchor.id);

      for (const term of terms) {
        // Skip very short terms
        if (term.length < 5) continue;

        const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];

          // Skip lines that are already wikilinks or inside code blocks
          if (line.includes('[[') || line.startsWith('```') || line.startsWith('    ')) {
            continue;
          }

          let match;
          while ((match = pattern.exec(line)) !== null) {
            const matchedText = match[0];
            const matchKey = `${entryKey}#${anchor.id}:${source.filePath}`;

            // Skip if we've already found this anchor match in this file
            if (seenMatches.has(matchKey)) {
              continue;
            }

            // Check if this specific anchor is already linked
            const anchorLinkPattern = new RegExp(
              `\\[\\[${entry.collection}:${entry.slug}#\\^?${anchor.id}`,
              'i'
            );
            if (anchorLinkPattern.test(source.content)) {
              continue;
            }

            seenMatches.add(matchKey);

            opportunities.push({
              sourceCollection: source.collection,
              sourceSlug: source.slug,
              sourceFile: source.filePath,
              sourceLine: lineIndex + 1,
              sourceContext: line.trim(),

              targetCollection: entry.collection,
              targetSlug: entry.slug,
              targetAnchor: anchor.id,

              matchedText,
              displayText: matchedText,
              confidence: 75,
              matchType: 'anchor',

              wikilink: generateWikilink(
                entry.collection,
                entry.slug,
                anchor.id,
                matchedText
              ),
            });

            // Only take first match per line
            break;
          }

          // Reset regex lastIndex
          pattern.lastIndex = 0;
        }
      }
    }
  }

  return opportunities;
}
