/**
 * Astro integration for generating mycelium graph data at build time.
 *
 * Reads ahora, journal, and cultivations collections. Extracts tracks,
 * articles, and cultivations. Builds unified connection graph.
 * Writes JSON to public/ for client-side visualization.
 */

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import {
  buildGraph,
  type MyceliumGraph,
  type TrackData,
  type ArticleData,
  type CultivationData,
  type AhoraLink,
} from '../lib/mycelium-graph.ts';

// Pattern for extracting wikilinks: [[collection:slug#fragment|display]]
const WIKILINK_PATTERN = /\[\[(\w+):([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

interface AhoraFrontmatter {
  date: string;
  escuchando?: Array<{
    artist: string;
    title: string;
    url: string;
    bpm?: number;
    key?: string;
    openKey?: string;
    timeSignature?: string;
    danceability?: number;
    songbpmId?: string;
    sourceVerified?: boolean;
    corrections?: string;
    energy?: number;
    genre?: string[];
  }>;
  articuloNuevo?: Array<{
    article: string;
    note?: string;
  }>;
}

interface JournalFrontmatter {
  title: string;
  date: string;
  draft?: boolean;
}

interface CultivationYaml {
  slug: string;
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  description: string;
}

/**
 * Extract wikilink target slugs from text.
 * Returns array like ["journal:slug", "journal:other-slug"]
 */
function extractWikilinks(text: string): string[] {
  const links: string[] = [];
  let match;
  // Reset lastIndex since we're reusing the regex
  WIKILINK_PATTERN.lastIndex = 0;
  while ((match = WIKILINK_PATTERN.exec(text)) !== null) {
    const collection = match[1];
    const slug = match[2];
    links.push(`${collection}:${slug}`);
  }
  return links;
}

/**
 * Read markdown content from a file, stripping frontmatter.
 */
async function readMarkdownBody(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return frontmatterMatch ? frontmatterMatch[1] : content;
}

export default function myceliumDataIntegration(): AstroIntegration {
  return {
    name: 'mycelium-data',
    hooks: {
      'astro:build:start': async () => {
        // Get project paths
        const integrationDir = dirname(fileURLToPath(import.meta.url));
        const projectRoot = join(integrationDir, '..', '..');
        const ahoraDir = join(projectRoot, 'src', 'content', 'ahora');
        const journalDir = join(projectRoot, 'src', 'content', 'journal');
        const cultivationsDir = join(projectRoot, 'src', 'content', 'cultivations');
        const publicDir = join(projectRoot, 'public');

        console.log('[mycelium] Building unified graph data...');

        try {
          const allTracks: TrackData[] = [];
          const allArticles: ArticleData[] = [];
          const allCultivations: CultivationData[] = [];
          const allAhoraLinks: AhoraLink[] = [];

          // === Read ahora dispatches ===
          const ahoraFiles = await readdir(ahoraDir);
          const ahoraMdFiles = ahoraFiles.filter(f => f.endsWith('.md'));

          for (const file of ahoraMdFiles) {
            const content = await readFile(join(ahoraDir, file), 'utf-8');
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = parseYaml(frontmatterMatch[1]) as AhoraFrontmatter;
            const dateStr = typeof frontmatter.date === 'string'
              ? frontmatter.date
              : new Date(frontmatter.date).toISOString().slice(0, 10);

            // Extract tracks
            if (frontmatter.escuchando) {
              for (const track of frontmatter.escuchando) {
                allTracks.push({
                  artist: track.artist,
                  title: track.title,
                  url: track.url,
                  bpm: track.bpm,
                  key: track.key,
                  openKey: track.openKey,
                  timeSignature: track.timeSignature,
                  danceability: track.danceability,
                  songbpmId: track.songbpmId,
                  sourceVerified: track.sourceVerified,
                  corrections: track.corrections,
                  energy: track.energy,
                  genre: track.genre,
                  date: dateStr,
                });
              }
            }

            // Extract article announcements
            if (frontmatter.articuloNuevo) {
              for (const announcement of frontmatter.articuloNuevo) {
                allAhoraLinks.push({
                  date: dateStr,
                  articleSlug: announcement.article,
                });
              }
            }
          }

          // === Read journal articles ===
          const journalEntries = await readdir(journalDir);
          for (const entry of journalEntries) {
            const entryPath = join(journalDir, entry);
            const entryStat = await stat(entryPath);
            if (!entryStat.isDirectory()) continue;

            // Read index.md for frontmatter
            const indexPath = join(entryPath, 'index.md');
            try {
              const indexContent = await readFile(indexPath, 'utf-8');
              const frontmatterMatch = indexContent.match(/^---\n([\s\S]*?)\n---/);
              if (!frontmatterMatch) continue;

              const frontmatter = parseYaml(frontmatterMatch[1]) as JournalFrontmatter;
              if (frontmatter.draft) continue; // Skip drafts

              // Collect all markdown bodies for wikilink extraction
              const wikilinks: string[] = [];

              // Read _article.md if exists
              try {
                const articlePath = join(entryPath, '_article.md');
                const articleBody = await readMarkdownBody(articlePath);
                wikilinks.push(...extractWikilinks(articleBody));
              } catch {
                // No _article.md, try reading from index.md body
                const indexBody = await readMarkdownBody(indexPath);
                wikilinks.push(...extractWikilinks(indexBody));
              }

              // Read _metalogue.md if exists
              try {
                const metalogueBody = await readMarkdownBody(join(entryPath, '_metalogue.md'));
                wikilinks.push(...extractWikilinks(metalogueBody));
              } catch {
                // No metalogue, that's fine
              }

              // Extract first ~100 chars of article body for excerpt
              let excerpt = '';
              try {
                const articleBody = await readMarkdownBody(join(entryPath, '_article.md'));
                excerpt = articleBody.replace(/[#*_\[\]]/g, '').slice(0, 100).trim();
              } catch {
                const indexBody = await readMarkdownBody(indexPath);
                excerpt = indexBody.replace(/[#*_\[\]]/g, '').slice(0, 100).trim();
              }

              const dateStr = typeof frontmatter.date === 'string'
                ? frontmatter.date
                : new Date(frontmatter.date).toISOString().slice(0, 10);

              allArticles.push({
                slug: entry,
                title: frontmatter.title,
                date: dateStr,
                excerpt,
                wikilinks: [...new Set(wikilinks)], // Dedupe
              });
            } catch {
              // Skip entries without valid index.md
            }
          }

          // === Read cultivations ===
          const cultivationFiles = await readdir(cultivationsDir);
          const yamlFiles = cultivationFiles.filter(f => f.endsWith('.yaml'));

          for (const file of yamlFiles) {
            const content = await readFile(join(cultivationsDir, file), 'utf-8');
            const data = parseYaml(content) as CultivationYaml;

            const wikilinks = extractWikilinks(data.description || '');

            allCultivations.push({
              slug: data.slug,
              name: data.name,
              status: data.status,
              wikilinks,
            });
          }

          // === Build unified graph ===
          const graph: MyceliumGraph = buildGraph({
            tracks: allTracks,
            articles: allArticles,
            cultivations: allCultivations,
            ahoraLinks: allAhoraLinks,
          });

          // Ensure public dir exists
          await mkdir(publicDir, { recursive: true });

          // Write JSON
          const outputPath = join(publicDir, 'mycelium-data.json');
          await writeFile(outputPath, JSON.stringify(graph, null, 2));

          const trackCount = graph.nodes.filter(n => n.type === 'track').length;
          const articleCount = graph.nodes.filter(n => n.type === 'article').length;
          const cultCount = graph.nodes.filter(n => n.type === 'cultivation').length;
          console.log(`[mycelium] Generated ${graph.nodes.length} nodes (${trackCount} tracks, ${articleCount} articles, ${cultCount} cultivations), ${graph.edges.length} edges`);
        } catch (error) {
          console.error('[mycelium] Error building graph:', error);
          // Don't fail the build, just write empty data
          const emptyGraph: MyceliumGraph = {
            nodes: [],
            edges: [],
            generated: new Date().toISOString(),
            meta: {
              tracksFromSongbpm: 0,
              articleCount: 0,
              cultivationCount: 0,
            },
          };
          const outputPath = join(projectRoot, 'public', 'mycelium-data.json');
          await writeFile(outputPath, JSON.stringify(emptyGraph, null, 2));
        }
      },
    },
  };
}
