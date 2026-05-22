/**
 * Cross-reference scanner.
 *
 * Scans all content for wikilink opportunities.
 */

import { basename, relative } from 'node:path';
import { buildRefsIndex, loadSourceFiles } from '../../lib/refs-index.ts';
import { findTitleMatches } from './matchers/title-matcher.ts';
import { findAnchorMatches } from './matchers/anchor-matcher.ts';
import type {
  ScanOptions,
  ScanResult,
  LinkOpportunity,
  Collection,
  MatchType,
} from '../../lib/refs-types.ts';
import {
  title,
  print,
  muted,
  divider,
  blank,
  style,
  symbols,
} from '../../lib/cli-style.ts';
import { getContentDir } from '../../lib/cli-utils.ts';

const CONTENT_DIR = getContentDir();

/**
 * Run the cross-reference scan.
 */
export async function runScan(options: ScanOptions = {}): Promise<ScanResult> {
  const { entry, minConfidence = 70, includeAnchors = true } = options;

  // Build the reference index
  const entries = await buildRefsIndex();

  // Load source files to scan
  const sources = await loadSourceFiles(entries, entry);

  // Find opportunities
  const allOpportunities: LinkOpportunity[] = [];

  for (const source of sources) {
    // Title matches
    const titleMatches = findTitleMatches(source, entries);
    allOpportunities.push(...titleMatches);

    // Anchor matches (optional)
    if (includeAnchors) {
      const anchorMatches = findAnchorMatches(source, entries);
      allOpportunities.push(...anchorMatches);
    }
  }

  // Filter by confidence
  const filtered = allOpportunities.filter((o) => o.confidence >= minConfidence);

  // Sort by source file, then line number
  filtered.sort((a, b) => {
    if (a.sourceFile !== b.sourceFile) {
      return a.sourceFile.localeCompare(b.sourceFile);
    }
    return a.sourceLine - b.sourceLine;
  });

  // Build stats
  const stats = {
    entriesScanned: entries.length,
    filesScanned: sources.length,
    opportunitiesFound: filtered.length,
    byCollection: {} as Record<Collection, number>,
    byMatchType: {} as Record<MatchType, number>,
  };

  for (const opp of filtered) {
    stats.byCollection[opp.targetCollection] =
      (stats.byCollection[opp.targetCollection] || 0) + 1;
    stats.byMatchType[opp.matchType] =
      (stats.byMatchType[opp.matchType] || 0) + 1;
  }

  return { opportunities: filtered, stats };
}

/**
 * Format a relative path for display.
 */
function formatPath(filePath: string): string {
  return relative(CONTENT_DIR, filePath);
}

/**
 * Format a confidence score with color.
 */
function formatConfidence(confidence: number): string {
  if (confidence >= 90) {
    return style.success(`${confidence}%`);
  } else if (confidence >= 75) {
    return style.ochre(`${confidence}%`);
  } else {
    return style.muted(`${confidence}%`);
  }
}

/**
 * Print scan results to terminal.
 */
export function printResults(result: ScanResult): void {
  title('cross-reference opportunities');

  if (result.opportunities.length === 0) {
    print('No opportunities found.');
    blank();
    return;
  }

  // Group by source file
  const byFile = new Map<string, LinkOpportunity[]>();
  for (const opp of result.opportunities) {
    const key = opp.sourceFile;
    if (!byFile.has(key)) {
      byFile.set(key, []);
    }
    byFile.get(key)!.push(opp);
  }

  for (const [file, opps] of byFile) {
    divider();
    print(
      `In ${style.bold(formatPath(file))} (${opps.length} ${opps.length === 1 ? 'opportunity' : 'opportunities'})`
    );
    blank();

    for (const opp of opps) {
      // Line number and context (truncated)
      const context =
        opp.sourceContext.length > 60
          ? opp.sourceContext.slice(0, 57) + '...'
          : opp.sourceContext;

      print(`Line ${style.ochre(String(opp.sourceLine))}:  "${context}"`);

      // Suggestion
      const targetDisplay =
        opp.targetAnchor
          ? `${opp.targetCollection}:${opp.targetSlug}#^${opp.targetAnchor}`
          : `${opp.targetCollection}:${opp.targetSlug}`;

      print(
        `         ${symbols.arrow} ${style.fern(opp.wikilink)} (${formatConfidence(opp.confidence)})`
      );
      blank();
    }
  }

  divider();
  print(style.bold('Summary:'));
  print(
    `  ${result.stats.opportunitiesFound} opportunities across ${byFile.size} files`
  );
  print(
    `  Scanned ${result.stats.entriesScanned} entries, ${result.stats.filesScanned} files`
  );

  if (Object.keys(result.stats.byMatchType).length > 0) {
    const types = Object.entries(result.stats.byMatchType)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    muted(`  By type: ${types}`);
  }

  blank();
}

/**
 * Print scan results as JSON.
 */
export function printResultsJson(result: ScanResult): void {
  console.log(JSON.stringify(result, null, 2));
}
