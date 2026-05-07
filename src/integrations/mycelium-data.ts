/**
 * Astro integration for generating mycelium graph data at build time.
 *
 * Reads ahora collection, extracts tracks, builds connection graph,
 * writes JSON to public/ for client-side visualization.
 */

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { buildGraph, type MyceliumGraph } from '../lib/mycelium-graph.ts';

interface AhoraFrontmatter {
  date: string;
  escuchando?: Array<{
    artist: string;
    title: string;
    url: string;
    // Objective (GetSongBPM)
    bpm?: number;
    key?: string;
    openKey?: string;
    timeSignature?: string;
    danceability?: number;
    songbpmId?: string;
    // Source verification
    sourceVerified?: boolean;
    corrections?: string;
    // Subjective
    energy?: number;
    // Other
    genre?: string[];
  }>;
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
        const publicDir = join(projectRoot, 'public');

        console.log('[mycelium] Building graph data...');

        try {
          // Read all ahora markdown files
          const files = await readdir(ahoraDir);
          const mdFiles = files.filter(f => f.endsWith('.md'));

          interface TrackData {
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
            date: string;
          }

          const allTracks: TrackData[] = [];

          for (const file of mdFiles) {
            const content = await readFile(join(ahoraDir, file), 'utf-8');

            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) continue;

            const frontmatter = parseYaml(frontmatterMatch[1]) as AhoraFrontmatter;

            if (!frontmatter.escuchando) continue;

            const dateStr = typeof frontmatter.date === 'string'
              ? frontmatter.date
              : new Date(frontmatter.date).toISOString().slice(0, 10);

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

          // Build the graph
          const graph: MyceliumGraph = buildGraph(allTracks);

          // Ensure public dir exists
          await mkdir(publicDir, { recursive: true });

          // Write JSON
          const outputPath = join(publicDir, 'mycelium-data.json');
          await writeFile(outputPath, JSON.stringify(graph, null, 2));

          console.log(`[mycelium] Generated ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
        } catch (error) {
          console.error('[mycelium] Error building graph:', error);
          // Don't fail the build, just write empty data
          const emptyGraph: MyceliumGraph = {
            nodes: [],
            edges: [],
            generated: new Date().toISOString(),
            meta: {
              tracksFromSongbpm: 0,
            },
          };
          const outputPath = join(projectRoot, 'public', 'mycelium-data.json');
          await writeFile(outputPath, JSON.stringify(emptyGraph, null, 2));
        }
      },
    },
  };
}
