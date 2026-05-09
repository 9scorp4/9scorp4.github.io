/**
 * Music metadata enrichment via GetSongBPM API
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { title, print, success, muted, blank, error } from '../../lib/cli-style.ts';
import { getContentDir } from '../../lib/cli-utils.ts';

const API_KEY = process.env.GETSONGBPM_API_KEY;
const AHORA_DIR = join(getContentDir(), 'ahora');
const API_BASE = 'https://api.getsong.co';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Track {
  artist: string;
  title: string;
  url: string;
  songbpmId?: string;
  bpm?: number;
  key?: string;
  openKey?: string;
  timeSignature?: string;
  danceability?: number;
  acousticness?: number;
  year?: number;
  album?: string;
  duration?: number;
  genre?: string[];
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

interface ParsedFile {
  path: string;
  frontmatter: AhoraFrontmatter;
  body: string;
  tracksToEnrich: Array<{ index: number; track: Track }>;
}

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// File processing
// ─────────────────────────────────────────────────────────────

function needsEnrichment(track: Track): boolean {
  return !!track.songbpmId && track.songbpmId !== 'not-found' && !track.bpm;
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
    muted(`  Skipping: ${track.artist} - ${track.title} (no songbpmId)`);
    return track;
  }

  print(`  Fetching: ${track.artist} - ${track.title} (${track.songbpmId})`);

  const song = await getSongById(track.songbpmId);

  if (!song) {
    error(`    Could not fetch song data`);
    return track;
  }

  const enriched: Track = { ...track };

  if (song.tempo) {
    const bpm = parseInt(song.tempo, 10);
    if (!isNaN(bpm)) {
      enriched.bpm = bpm;
      muted(`    bpm: ${bpm}`);
    }
  }

  if (song.key_of) {
    enriched.key = song.key_of;
    muted(`    key: ${song.key_of}`);
  }

  if (song.open_key) {
    enriched.openKey = song.open_key;
    muted(`    openKey: ${song.open_key}`);
  }

  if (song.time_sig) {
    enriched.timeSignature = song.time_sig;
    muted(`    timeSignature: ${song.time_sig}`);
  }

  if (song.danceability !== undefined) {
    enriched.danceability = song.danceability;
    muted(`    danceability: ${song.danceability}`);
  }

  if (song.acousticness !== undefined) {
    enriched.acousticness = song.acousticness;
    muted(`    acousticness: ${song.acousticness}`);
  }

  if (song.album?.title) {
    enriched.album = song.album.title;
    muted(`    album: ${song.album.title}`);
  }

  if (song.album?.year) {
    const year = parseInt(song.album.year, 10);
    if (!isNaN(year)) {
      enriched.year = year;
      muted(`    year: ${year}`);
    }
  }

  if (song.artist?.genres?.length) {
    enriched.genre = song.artist.genres;
    muted(`    genre: ${enriched.genre.join(', ')}`);
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));

  return enriched;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function run(args: string[]): Promise<void> {
  const dryRun = args.includes('--dry-run');

  title('music metadata enrichment');

  if (!API_KEY) {
    error('Missing GETSONGBPM_API_KEY in .env');
    print('Register at: https://getsongbpm.com/api');
    blank();
    process.exit(1);
  }

  print(`Scanning ${AHORA_DIR}...`);
  blank();

  const files = readdirSync(AHORA_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => join(AHORA_DIR, f));

  const filesToProcess: ParsedFile[] = [];

  for (const file of files) {
    const parsed = parseAhoraFile(file);
    if (parsed) filesToProcess.push(parsed);
  }

  if (filesToProcess.length === 0) {
    muted('No tracks need enrichment.');
    blank();
    print('To enrich a track:');
    muted('  1. Find song on getsongbpm.com');
    muted('  2. Copy ID from URL (e.g., lOKZLg from /song/warrior-s-dance/lOKZLg)');
    muted('  3. Add songbpmId: lOKZLg to track frontmatter');
    muted('  4. Re-run this command');
    blank();
    return;
  }

  const totalTracks = filesToProcess.reduce(
    (sum, f) => sum + f.tracksToEnrich.length,
    0
  );

  print(`Found ${totalTracks} track(s) to enrich in ${filesToProcess.length} file(s).`);

  if (dryRun) {
    blank();
    muted('[DRY RUN] Would fetch:');
    blank();
    for (const file of filesToProcess) {
      print(`  ${file.path}:`);
      for (const { track } of file.tracksToEnrich) {
        muted(`    - ${track.artist} - ${track.title} (${track.songbpmId})`);
      }
    }
    blank();
    return;
  }

  blank();

  for (const file of filesToProcess) {
    print(file.path);

    for (const { index, track } of file.tracksToEnrich) {
      const enriched = await enrichTrack(track);
      file.frontmatter.escuchando![index] = enriched;
    }

    writeAhoraFile(file);
    blank();
  }

  success('Done. Attribution: getsongbpm.com');
  blank();
}
