/**
 * Utilities for handling journal entry folder names with numeric prefixes.
 *
 * Folder format: `XX_slug` where XX is a 2-digit entry number.
 * Example: `01_lo-que-cruza`, `02_al-borde-del-fenomeno`
 *
 * This allows chronological ordering in the filesystem while keeping
 * wikilinks and batch-queue.yaml using clean slugs.
 */

const PREFIXED_PATTERN = /^(\d{2})_(.+)$/;

/**
 * Extract the clean slug from a folder name.
 * Handles both prefixed (`01_slug`) and unprefixed (`slug`) formats.
 */
export function extractSlug(folderName: string): string {
  const match = folderName.match(PREFIXED_PATTERN);
  return match ? match[2] : folderName;
}

/**
 * Extract the entry number from a prefixed folder name.
 * Returns null for unprefixed folder names.
 */
export function extractEntryNumber(folderName: string): number | null {
  const match = folderName.match(PREFIXED_PATTERN);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Build a folder name from a slug and entry number.
 */
export function buildFolderName(slug: string, entryNumber: number): string {
  return `${String(entryNumber).padStart(2, '0')}_${slug}`;
}

/**
 * Check if a folder name has a numeric prefix.
 */
export function hasPrefixedFormat(folderName: string): boolean {
  return PREFIXED_PATTERN.test(folderName);
}
