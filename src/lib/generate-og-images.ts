/**
 * OG image generator using Satori + resvg.
 * Called from the Astro integration after build.
 */

import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import * as yaml from 'yaml';
import { DefaultOGImage, ArticleOGImage } from './og-image.tsx';
import { loadFonts, generatePng } from './shared-image-utils.ts';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

interface JournalEntry {
  slug: string;
  title: string;
  date: Date;
  draft: boolean;
}

/**
 * Parse frontmatter from a markdown file.
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return yaml.parse(match[1]) as Record<string, unknown>;
}

/**
 * Load journal entries from the content directory.
 */
async function loadJournalEntries(srcDir: string): Promise<JournalEntry[]> {
  const journalDir = join(srcDir, 'content', 'journal');
  const entries: JournalEntry[] = [];

  const items = await readdir(journalDir);

  for (const item of items) {
    const itemPath = join(journalDir, item);
    const itemStat = await stat(itemPath);

    if (itemStat.isDirectory()) {
      // Look for index.md in the directory
      const indexPath = join(itemPath, 'index.md');
      try {
        const content = await readFile(indexPath, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        if (!frontmatter.draft) {
          entries.push({
            slug: item,
            title: frontmatter.title as string,
            date: new Date(frontmatter.date as string),
            draft: false,
          });
        }
      } catch {
        // index.md doesn't exist, skip
      }
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      // Standalone markdown file
      const content = await readFile(itemPath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter.draft) {
        const slug = basename(item, item.endsWith('.mdx') ? '.mdx' : '.md');
        entries.push({
          slug,
          title: frontmatter.title as string,
          date: new Date(frontmatter.date as string),
          draft: false,
        });
      }
    }
  }

  return entries;
}

const OG_DIMENSIONS = { width: OG_WIDTH, height: OG_HEIGHT };

export interface GenerateOGImagesOptions {
  distDir: string;
  projectRoot: string;
  srcDir: string;
}

export async function generateOGImages({
  distDir,
  projectRoot,
  srcDir,
}: GenerateOGImagesOptions): Promise<void> {
  console.log('[og-images] Loading fonts...');
  const fonts = await loadFonts(projectRoot);

  const outputDir = join(distDir, 'og-images');
  await mkdir(outputDir, { recursive: true });

  // Generate default/homepage image
  console.log('[og-images] Generating default.png...');
  const defaultPng = await generatePng(DefaultOGImage(), fonts, OG_DIMENSIONS);
  await writeFile(join(outputDir, 'default.png'), defaultPng);

  // Generate images for each journal entry
  console.log('[og-images] Loading journal entries...');
  const entries = await loadJournalEntries(srcDir);

  for (const entry of entries) {
    const filename = `cuaderno-${entry.slug}.png`;
    console.log(`[og-images] Generating ${filename}...`);

    const png = await generatePng(
      ArticleOGImage({
        title: entry.title,
        date: entry.date,
      }),
      fonts,
      OG_DIMENSIONS
    );

    await writeFile(join(outputDir, filename), png);
  }

  console.log(`[og-images] Generated ${entries.length + 1} images.`);
}
