/**
 * Utility functions for the Mycelium graph system.
 */

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): 'spotify' | 'youtube' | 'bandcamp' | 'soundcloud' | 'github' | 'external' {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('spotify.com')) return 'spotify';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('bandcamp.com')) return 'bandcamp';
    if (hostname.includes('soundcloud.com')) return 'soundcloud';
    if (hostname.includes('github.com')) return 'github';
    return 'external';
  } catch {
    return 'external';
  }
}

/**
 * Get display label for a platform
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    spotify: 'Spotify',
    youtube: 'YouTube',
    bandcamp: 'Bandcamp',
    soundcloud: 'SoundCloud',
    github: 'GitHub',
    external: 'external',
  };
  return labels[platform] || 'external';
}

/**
 * Create a stable ID for an exit node from URL
 */
export function createExitNodeId(url: string): string {
  // Simple hash - djb2 algorithm
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) + hash) ^ url.charCodeAt(i);
  }
  return `x${Math.abs(hash).toString(36)}`;
}

/**
 * Create a stable ID from artist + title
 */
export function createNodeId(artist: string, title: string): string {
  const normalized = `${artist.toLowerCase().trim()}:${title.toLowerCase().trim()}`;
  // Simple hash - djb2 algorithm
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  }
  return `t${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate days between two ISO date strings
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Check if two tracks have similar BPM (within ±10)
 */
export function similarBpm(bpm1?: number, bpm2?: number): boolean {
  if (bpm1 === undefined || bpm2 === undefined) return false;
  return Math.abs(bpm1 - bpm2) <= 10;
}

/**
 * Normalize key notation for comparison
 */
export function normalizeKey(key?: string): string | null {
  if (!key) return null;
  // Handle common formats: "Am", "A minor", "C#", "Db"
  return key.toLowerCase().replace(/\s*(minor|major|min|maj)\s*/g, '').trim();
}

/**
 * Check if two tracks have similar danceability (within ±15)
 */
export function similarDanceability(d1?: number, d2?: number): boolean {
  if (d1 === undefined || d2 === undefined) return false;
  return Math.abs(d1 - d2) <= 15;
}

/**
 * Check if two genre arrays share any genre
 */
export function sharedGenre(g1?: string[], g2?: string[]): string | null {
  if (!g1?.length || !g2?.length) return null;
  const set1 = new Set(g1.map(g => g.toLowerCase()));
  for (const g of g2) {
    if (set1.has(g.toLowerCase())) return g;
  }
  return null;
}
