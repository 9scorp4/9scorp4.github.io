/**
 * Types for the cross-reference scanner.
 *
 * Supports all content collections: journal, ahora, specimens, cultivations.
 */

export type Collection = 'journal' | 'ahora' | 'specimen' | 'cultivation';

export interface BlockAnchor {
  id: string;
  lineNumber: number;
  context: string; // Surrounding text for context
}

/**
 * A content entry that can be linked to.
 */
export interface LinkableEntry {
  collection: Collection;
  slug: string;
  folderName?: string; // For journal entries (e.g., "13_lo-que-no-cruza")
  title: string;
  titleSecondary?: string; // English equivalent for journal entries
  anchors: BlockAnchor[];
  filePath: string; // Primary file to scan (e.g., _article.md or index.md)
  allFiles: string[]; // All files in this entry (for diptychs: index.md, _article.md, _metalogue.md)
}

/**
 * A source file that can contain wikilink opportunities.
 */
export interface SourceFile {
  collection: Collection;
  slug: string;
  filePath: string;
  content: string;
}

export type MatchType =
  | 'exact-title'
  | 'partial-title'
  | 'secondary-title'
  | 'anchor'
  | 'bilingual';

/**
 * A potential wikilink opportunity found by the scanner.
 */
export interface LinkOpportunity {
  // Source info
  sourceCollection: Collection;
  sourceSlug: string;
  sourceFile: string;
  sourceLine: number;
  sourceContext: string; // The line containing the match

  // Target info
  targetCollection: Collection;
  targetSlug: string;
  targetAnchor?: string; // If linking to a specific anchor

  // Match details
  matchedText: string; // The text that was matched
  displayText: string; // Suggested display text for the wikilink
  confidence: number; // 0-100
  matchType: MatchType;

  // Generated wikilink
  wikilink: string; // e.g., [[journal:slug|display]]
}

/**
 * Options for the refs scanner.
 */
export interface ScanOptions {
  /** Focus on a single entry (collection:slug) */
  entry?: string;
  /** Minimum confidence threshold (default: 70) */
  minConfidence?: number;
  /** Include anchor-level suggestions */
  includeAnchors?: boolean;
  /** Output as JSON for agent consumption */
  json?: boolean;
}

/**
 * Result of a refs scan.
 */
export interface ScanResult {
  opportunities: LinkOpportunity[];
  stats: {
    entriesScanned: number;
    filesScanned: number;
    opportunitiesFound: number;
    byCollection: Record<Collection, number>;
    byMatchType: Record<MatchType, number>;
  };
}
