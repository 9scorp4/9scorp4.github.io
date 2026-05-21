#!/usr/bin/env tsx
/**
 * Migration script: Rename journal folders to XX_slug format.
 *
 * Reads the `entry` field from each journal's index.md frontmatter
 * and renames the folder to include a 2-digit numeric prefix.
 *
 * Usage:
 *   npx tsx scripts/migrate-journal-folders.ts --dry-run   # Preview changes
 *   npx tsx scripts/migrate-journal-folders.ts             # Apply changes
 */

import { readdir, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const JOURNAL_DIR = 'src/content/journal';

interface Frontmatter {
  entry?: number;
  title?: string;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return parseYaml(match[1]) as Frontmatter;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 Dry run mode — no changes will be made\n');
  }

  const items = await readdir(JOURNAL_DIR, { withFileTypes: true });
  const renames: Array<{ from: string; to: string }> = [];
  const skipped: string[] = [];
  const errors: Array<{ folder: string; reason: string }> = [];

  for (const item of items) {
    if (!item.isDirectory()) continue;

    // Skip already-prefixed folders
    if (/^\d{2}_/.test(item.name)) {
      skipped.push(item.name);
      continue;
    }

    const indexPath = join(JOURNAL_DIR, item.name, 'index.md');

    let content: string;
    try {
      content = await readFile(indexPath, 'utf-8');
    } catch {
      errors.push({ folder: item.name, reason: 'No index.md found' });
      continue;
    }

    const fm = parseFrontmatter(content);
    const entry = fm.entry;

    if (typeof entry !== 'number') {
      errors.push({ folder: item.name, reason: 'Missing or invalid "entry" field in frontmatter' });
      continue;
    }

    const newName = `${String(entry).padStart(2, '0')}_${item.name}`;
    renames.push({ from: item.name, to: newName });
  }

  // Print summary
  if (skipped.length > 0) {
    console.log(`⏭️  Already prefixed (${skipped.length}):`);
    for (const name of skipped) {
      console.log(`   ${name}`);
    }
    console.log();
  }

  if (errors.length > 0) {
    console.log(`⚠️  Errors (${errors.length}):`);
    for (const { folder, reason } of errors) {
      console.log(`   ${folder}: ${reason}`);
    }
    console.log();
  }

  if (renames.length === 0) {
    console.log('✓ No folders to rename.');
    return;
  }

  console.log(`📁 Folders to rename (${renames.length}):`);
  for (const { from, to } of renames) {
    console.log(`   ${from} → ${to}`);
  }
  console.log();

  if (dryRun) {
    console.log('Run without --dry-run to apply changes.');
    return;
  }

  // Apply renames
  for (const { from, to } of renames) {
    await rename(join(JOURNAL_DIR, from), join(JOURNAL_DIR, to));
    console.log(`✓ Renamed: ${from} → ${to}`);
  }

  console.log(`\n✓ Renamed ${renames.length} folder(s).`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
