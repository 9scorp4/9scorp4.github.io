#!/usr/bin/env npx tsx
/**
 * Enrich track metadata via GetSongBPM API
 *
 * Usage:
 *   npx tsx scripts/music-enrich.ts              # enrich all tracks with songbpmId
 *   npx tsx scripts/music-enrich.ts --dry-run    # preview what would be fetched
 *
 * Workflow (non-probabilistic):
 *   1. Find song on getsongbpm.com
 *   2. Copy ID from URL (e.g., lOKZLg from /song/warrior-s-dance/lOKZLg)
 *   3. Add songbpmId: lOKZLg to track in frontmatter
 *   4. Run this script to fetch BPM, key, etc.
 *
 * Environment:
 *   GETSONGBPM_API_KEY - GetSongBPM API key
 *
 * Register at: https://getsongbpm.com/api
 * Note: Using the API requires a backlink to getsongbpm.com
 */

import { config } from 'dotenv';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

config();

const API_KEY = process.env.GETSONGBPM_API_KEY;
const AHORA_DIR = join(process.cwd(), 'src/content/ahora');
const API_BASE = 'https://api.getsong.co';

interface Track {
  artist: string;
  title: string;
  url: string;
  // GetSongBPM fields
  songbpmId?: string;
  bpm?: number;
  key?: string;
  openKey?: string;
  timeSignature?: string;
  danceability?: number;
  acousticness?: number;
  // General
  year?: number;
  album?: string;
  duration?: number;
  genre?: string[];
  // Subjective
  mood?: string[];
  energy?: number;
  context?: string[];
  discovered?: string;
  notes?: string;
}

interface AhoraFrontmatter {
  date: string;
  escuchando?: Track[];
}

interface SongBpmSong {
  id: string;
  title: string;
  tempo: string;
  key_of: string;
  open_key?: string;
  time_sig?: string;
  danceability?: number;
  acousticness?: number;
  album?: {
    title: string;
    year?: string;
  };
  artist?: {
    name: string;
    genres?: string[];
  };
}

interface SongBpmSongResponse {
  song?: SongBpmSong;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  if (!API_KEY) {
    throw new Error('Missing GETSONGBPM_API_KEY');
  }

  const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'JardinCibernetico/1.0 (music enrichment; +https://9scorp4.github.io)',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GetSongBPM API error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

async function getSongById(songId: string): Promise<SongBpmSong | null> {
  const data = await apiGet<SongBpmSongResponse>(`/song/?id=${songId}`);
  return data.song || null;
}

/**
 * Track needs enrichment if it has a songbpmId but is missing BPM data
 */
function needsEnrichment(track: Track): boolean {
  return !!track.songbpmId && track.songbpmId !== 'not-found' && !track.bpm;
}

interface ParsedFile {
  path: string;
  frontmatter: AhoraFrontmatter;
  body: string;
  tracksToEnrich: Array<{ index: number; track: Track }>;
}

function parseAhoraFile(filePath: string): ParsedFile | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) return null;

  const frontmatter = parseYaml(match[1]) as AhoraFrontmatter;
  const body = match[2];

  if (!frontmatter.escuchando?.length) return null;

  const tracksToEnrich = frontmatter.escuchando
    .map((track, index) => ({ index, track }))
    .filter(({ track }) => needsEnrichment(track));

  if (tracksToEnrich.length === 0) return null;

  return { path: filePath, frontmatter, body, tracksToEnrich };
}

function writeAhoraFile(parsed: ParsedFile): void {
  const yaml = stringifyYaml(parsed.frontmatter, {
    lineWidth: 0,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });
  const content = `---\n${yaml}---\n${parsed.body}`;
  writeFileSync(parsed.path, content);
}

async function enrichTrack(track: Track): Promise<Track> {
  if (!track.songbpmId) {
    console.log(`  Skipping: ${track.artist} - ${track.title} (no songbpmId)`);
    return track;
  }

  console.log(`  Fetching: ${track.artist} - ${track.title} (${track.songbpmId})`);

  const song = await getSongById(track.songbpmId);

  if (!song) {
    console.log(`    Error: Could not fetch song data`);
    return track;
  }

  const enriched: Track = { ...track };

  // BPM
  if (song.tempo) {
    const bpm = parseInt(song.tempo, 10);
    if (!isNaN(bpm)) {
      enriched.bpm = bpm;
      console.log(`    bpm: ${bpm}`);
    }
  }

  // Key
  if (song.key_of) {
    enriched.key = song.key_of;
    console.log(`    key: ${song.key_of}`);
  }

  // Open Key (Camelot notation)
  if (song.open_key) {
    enriched.openKey = song.open_key;
    console.log(`    openKey: ${song.open_key}`);
  }

  // Time signature
  if (song.time_sig) {
    enriched.timeSignature = song.time_sig;
    console.log(`    timeSignature: ${song.time_sig}`);
  }

  // Danceability
  if (song.danceability !== undefined) {
    enriched.danceability = song.danceability;
    console.log(`    danceability: ${song.danceability}`);
  }

  // Acousticness
  if (song.acousticness !== undefined) {
    enriched.acousticness = song.acousticness;
    console.log(`    acousticness: ${song.acousticness}`);
  }

  // Album
  if (song.album?.title) {
    enriched.album = song.album.title;
    console.log(`    album: ${song.album.title}`);
  }

  // Year from album
  if (song.album?.year) {
    const year = parseInt(song.album.year, 10);
    if (!isNaN(year)) {
      enriched.year = year;
      console.log(`    year: ${year}`);
    }
  }

  // Genres from artist
  if (song.artist?.genres?.length) {
    enriched.genre = song.artist.genres;
    console.log(`    genre: ${enriched.genre.join(', ')}`);
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));

  return enriched;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (!API_KEY) {
    console.error('Missing GETSONGBPM_API_KEY in .env');
    console.error('Register at: https://getsongbpm.com/api');
    process.exit(1);
  }

  console.log(`Scanning ${AHORA_DIR}...\n`);

  const files = readdirSync(AHORA_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => join(AHORA_DIR, f));

  const filesToProcess: ParsedFile[] = [];

  for (const file of files) {
    const parsed = parseAhoraFile(file);
    if (parsed) filesToProcess.push(parsed);
  }

  if (filesToProcess.length === 0) {
    console.log('No tracks need enrichment.');
    console.log('\nTo enrich a track:');
    console.log('  1. Find song on getsongbpm.com');
    console.log('  2. Copy ID from URL (e.g., lOKZLg from /song/warrior-s-dance/lOKZLg)');
    console.log('  3. Add songbpmId: lOKZLg to track frontmatter');
    console.log('  4. Re-run this script');
    return;
  }

  const totalTracks = filesToProcess.reduce(
    (sum, f) => sum + f.tracksToEnrich.length,
    0
  );

  console.log(`Found ${totalTracks} track(s) to enrich in ${filesToProcess.length} file(s).`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would fetch:\n');
    for (const file of filesToProcess) {
      console.log(`  ${file.path}:`);
      for (const { track } of file.tracksToEnrich) {
        console.log(`    - ${track.artist} - ${track.title} (${track.songbpmId})`);
      }
    }
    return;
  }

  console.log('');

  for (const file of filesToProcess) {
    console.log(`${file.path}`);

    for (const { index, track } of file.tracksToEnrich) {
      const enriched = await enrichTrack(track);
      file.frontmatter.escuchando![index] = enriched;
    }

    writeAhoraFile(file);
    console.log('');
  }

  console.log('Done. Attribution: getsongbpm.com');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
