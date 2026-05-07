/**
 * Mycelium Graph - builds connection graph from ahora dispatches
 *
 * Songs connect where they touched: same dispatch, temporal proximity,
 * same artist, similar BPM, harmonic compatibility, shared genres.
 */

export interface MyceliumNode {
  id: string;           // hash of artist+title
  artist: string;
  title: string;
  url: string;
  // Objective (GetSongBPM)
  bpm?: number;
  key?: string;
  openKey?: string;     // Camelot notation
  timeSignature?: string;
  danceability?: number;
  songbpmId?: string;   // provenance marker
  // Source verification
  sourceVerified?: boolean;
  corrections?: string;
  // Subjective
  energy?: number;
  // Meta
  firstHeard: string;   // ISO date
  appearances: number;
}

export interface MyceliumEdge {
  source: string;
  target: string;
  weight: number;       // connection strength
  reasons: string[];    // why connected
}

export interface MyceliumGraph {
  nodes: MyceliumNode[];
  edges: MyceliumEdge[];
  generated: string;    // ISO timestamp
  meta: {
    tracksFromSongbpm: number;
  };
}

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

/**
 * Create a stable ID from artist + title
 */
function createNodeId(artist: string, title: string): string {
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
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Check if two tracks have similar BPM (within ±10)
 */
function similarBpm(bpm1?: number, bpm2?: number): boolean {
  if (bpm1 === undefined || bpm2 === undefined) return false;
  return Math.abs(bpm1 - bpm2) <= 10;
}

/**
 * Normalize key notation for comparison
 */
function normalizeKey(key?: string): string | null {
  if (!key) return null;
  // Handle common formats: "Am", "A minor", "C#", "Db"
  return key.toLowerCase().replace(/\s*(minor|major|min|maj)\s*/g, '').trim();
}

/**
 * Check if two tracks have similar danceability (within ±15)
 */
function similarDanceability(d1?: number, d2?: number): boolean {
  if (d1 === undefined || d2 === undefined) return false;
  return Math.abs(d1 - d2) <= 15;
}

/**
 * Check if two genre arrays share any genre
 */
function sharedGenre(g1?: string[], g2?: string[]): string | null {
  if (!g1?.length || !g2?.length) return null;
  const set1 = new Set(g1.map(g => g.toLowerCase()));
  for (const g of g2) {
    if (set1.has(g.toLowerCase())) return g;
  }
  return null;
}

/**
 * Build the mycelium graph from track data
 */
export function buildGraph(tracks: TrackData[]): MyceliumGraph {
  const nodeMap = new Map<string, MyceliumNode>();
  const edgeMap = new Map<string, { weight: number; reasons: Set<string> }>();

  // Build nodes, tracking appearances
  for (const track of tracks) {
    const id = createNodeId(track.artist, track.title);
    const existing = nodeMap.get(id);

    if (existing) {
      existing.appearances++;
      // Keep earliest date
      if (track.date < existing.firstHeard) {
        existing.firstHeard = track.date;
      }
      // Update metadata if we have it (prefer newer data)
      if (track.bpm !== undefined) existing.bpm = track.bpm;
      if (track.key !== undefined) existing.key = track.key;
      if (track.openKey !== undefined) existing.openKey = track.openKey;
      if (track.timeSignature !== undefined) existing.timeSignature = track.timeSignature;
      if (track.danceability !== undefined) existing.danceability = track.danceability;
      if (track.songbpmId !== undefined) existing.songbpmId = track.songbpmId;
      if (track.sourceVerified !== undefined) existing.sourceVerified = track.sourceVerified;
      if (track.corrections !== undefined) existing.corrections = track.corrections;
      if (track.energy !== undefined) existing.energy = track.energy;
    } else {
      nodeMap.set(id, {
        id,
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
        firstHeard: track.date,
        appearances: 1,
      });
    }
  }

  // Group tracks by date for dispatch-based connections
  const tracksByDate = new Map<string, TrackData[]>();
  for (const track of tracks) {
    const dateKey = track.date.slice(0, 10); // ISO date portion
    const list = tracksByDate.get(dateKey) || [];
    list.push(track);
    tracksByDate.set(dateKey, list);
  }

  // Build edges
  const trackList = tracks.map(t => ({
    ...t,
    id: createNodeId(t.artist, t.title),
  }));

  for (let i = 0; i < trackList.length; i++) {
    for (let j = i + 1; j < trackList.length; j++) {
      const a = trackList[i];
      const b = trackList[j];

      // Skip self-connections
      if (a.id === b.id) continue;

      const edgeKey = [a.id, b.id].sort().join(':');
      const existing = edgeMap.get(edgeKey) || { weight: 0, reasons: new Set<string>() };

      // Same dispatch
      if (a.date.slice(0, 10) === b.date.slice(0, 10)) {
        existing.weight += 1.0;
        existing.reasons.add('same dispatch');
      } else {
        // Temporal proximity
        const days = daysBetween(a.date, b.date);
        if (days <= 2) {
          existing.weight += 0.7;
          existing.reasons.add('adjacent days');
        } else if (days <= 7) {
          existing.weight += 0.4;
          existing.reasons.add('same week');
        }
      }

      // Same artist
      if (a.artist.toLowerCase().trim() === b.artist.toLowerCase().trim()) {
        existing.weight += 0.5;
        existing.reasons.add('same artist');
      }

      // Similar BPM
      if (similarBpm(a.bpm, b.bpm)) {
        existing.weight += 0.3;
        existing.reasons.add('similar tempo');
      }

      // Same key
      const keyA = normalizeKey(a.key);
      const keyB = normalizeKey(b.key);
      if (keyA && keyB && keyA === keyB) {
        existing.weight += 0.3;
        existing.reasons.add('same key');
      }

      // Same open key (Camelot) - harmonic compatibility
      if (a.openKey && b.openKey && a.openKey === b.openKey) {
        existing.weight += 0.3;
        existing.reasons.add('harmonic');
      }

      // Same time signature
      if (a.timeSignature && b.timeSignature && a.timeSignature === b.timeSignature) {
        // Only count non-4/4 as interesting connection
        if (a.timeSignature !== '4/4') {
          existing.weight += 0.2;
          existing.reasons.add('same meter');
        }
      }

      // Similar danceability
      if (similarDanceability(a.danceability, b.danceability)) {
        existing.weight += 0.2;
        existing.reasons.add('similar groove');
      }

      // Shared genre
      const shared = sharedGenre(a.genre, b.genre);
      if (shared) {
        existing.weight += 0.25;
        existing.reasons.add('genre');
      }

      if (existing.weight > 0) {
        edgeMap.set(edgeKey, existing);
      }
    }
  }

  // Filter edges below threshold and convert to array
  const edges: MyceliumEdge[] = [];
  for (const [key, data] of edgeMap) {
    if (data.weight >= 0.3) {
      const [source, target] = key.split(':');
      edges.push({
        source,
        target,
        weight: Math.round(data.weight * 100) / 100, // Round to 2 decimals
        reasons: Array.from(data.reasons),
      });
    }
  }

  const nodesArray = Array.from(nodeMap.values());
  const tracksFromSongbpm = nodesArray.filter(n => n.songbpmId).length;

  return {
    nodes: nodesArray,
    edges,
    generated: new Date().toISOString(),
    meta: {
      tracksFromSongbpm,
    },
  };
}
