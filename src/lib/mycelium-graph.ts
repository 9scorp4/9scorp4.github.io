/**
 * Mycelium Graph - builds connection graph from dispatches, articles, cultivations
 *
 * Songs and writings connect where they touched: same dispatch, temporal proximity,
 * wikilinks, announcements, same artist, similar BPM, harmonic compatibility.
 */

export type NodeType = 'track' | 'article' | 'cultivation' | 'dispatch' | 'exit';
export type EdgeType = 'musical' | 'wikilink' | 'announced' | 'context' | 'exit';
export type CitationType = 'section' | 'text' | 'block' | 'heading';

export interface MyceliumNode {
  id: string;
  type: NodeType;
  // Common
  firstSeen: string;    // ISO date
  appearances: number;
  // Track-specific
  artist?: string;
  title?: string;
  url?: string;
  bpm?: number;
  key?: string;
  openKey?: string;     // Camelot notation
  timeSignature?: string;
  danceability?: number;
  songbpmId?: string;   // provenance marker
  sourceVerified?: boolean;
  corrections?: string;
  energy?: number;
  // Article-specific
  slug?: string;
  articleTitle?: string;
  excerpt?: string;     // first ~100 chars
  // Cultivation-specific
  cultivationName?: string;
  status?: 'growing' | 'dormant' | 'wild' | 'composted';
  // Dispatch-specific
  date?: string;
  announcements?: number;
  hasProseLinks?: boolean;
  // Exit-specific
  platform?: 'spotify' | 'youtube' | 'bandcamp' | 'soundcloud' | 'github' | 'external';
  label?: string;
}

export interface MyceliumEdge {
  source: string;
  target: string;
  weight: number;       // connection strength
  reasons: string[];    // why connected
  edgeType: EdgeType;   // for visual differentiation
  citationType?: CitationType;  // only when edgeType === 'wikilink'
  citationCount?: number;       // aggregated citations to same target
}

export interface MyceliumGraph {
  nodes: MyceliumNode[];
  edges: MyceliumEdge[];
  generated: string;    // ISO timestamp
  meta: {
    tracksFromSongbpm: number;
    articleCount: number;
    cultivationCount: number;
    dispatchCount?: number;
    exitCount?: number;
  };
}

export interface TrackData {
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

export interface WikilinkData {
  target: string;           // "collection:slug"
  citationType: CitationType;
  anchor?: string;          // raw anchor for tooltips
}

export interface ArticleData {
  slug: string;
  title: string;
  date: string;       // ISO date
  excerpt: string;    // first ~100 chars
  wikilinks: WikilinkData[]; // rich wikilink data
}

export interface CultivationData {
  slug: string;
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  wikilinks: WikilinkData[]; // rich wikilink data
}

export interface AhoraLink {
  date: string;       // dispatch date
  articleSlug: string; // article announced
}

export interface DispatchData {
  date: string;                    // ISO date
  announcements: number;           // count of articuloNuevo + specimenNuevo + cultivando
  hasProseLinks: boolean;          // has wikilinks or external links in prose
  proseWikilinks: WikilinkData[];  // rich wikilink data
  proseExternalLinks: string[];    // external URLs in prose
}

export interface GraphInput {
  tracks: TrackData[];
  articles: ArticleData[];
  cultivations: CultivationData[];
  ahoraLinks: AhoraLink[]; // articuloNuevo announcements
  dispatches?: DispatchData[]; // notable dispatches
}

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
function getPlatformLabel(platform: string): string {
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

interface EdgeData {
  weight: number;
  reasons: Set<string>;
  edgeType: EdgeType;
  citationType?: CitationType;
  citationCount?: number;
}

/**
 * Build the unified mycelium graph from tracks, articles, and cultivations
 */
export function buildGraph(input: GraphInput): MyceliumGraph {
  const nodeMap = new Map<string, MyceliumNode>();
  const edgeMap = new Map<string, EdgeData>();

  const { tracks, articles, cultivations, ahoraLinks, dispatches = [] } = input;

  // === Build track nodes ===
  for (const track of tracks) {
    const id = createNodeId(track.artist, track.title);
    const existing = nodeMap.get(id);

    if (existing && existing.type === 'track') {
      existing.appearances++;
      if (track.date < existing.firstSeen) {
        existing.firstSeen = track.date;
      }
      // Update metadata (prefer newer data)
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
        type: 'track',
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
        firstSeen: track.date,
        appearances: 1,
      });
    }
  }

  // === Build article nodes ===
  for (const article of articles) {
    const id = `a:${article.slug}`;
    nodeMap.set(id, {
      id,
      type: 'article',
      slug: article.slug,
      articleTitle: article.title,
      excerpt: article.excerpt,
      firstSeen: article.date,
      appearances: 1,
    });
  }

  // === Build cultivation nodes ===
  for (const cult of cultivations) {
    const id = `c:${cult.slug}`;
    nodeMap.set(id, {
      id,
      type: 'cultivation',
      slug: cult.slug,
      cultivationName: cult.name,
      status: cult.status,
      firstSeen: new Date().toISOString().slice(0, 10), // no date for cultivations
      appearances: 1,
    });
  }

  // === Build exit nodes from track URLs ===
  const exitNodesByUrl = new Map<string, { id: string; appearances: number; firstSeen: string }>();
  for (const track of tracks) {
    if (!track.url) continue;
    const exitId = createExitNodeId(track.url);
    const existing = exitNodesByUrl.get(track.url);
    if (existing) {
      existing.appearances++;
      if (track.date < existing.firstSeen) {
        existing.firstSeen = track.date;
      }
    } else {
      exitNodesByUrl.set(track.url, { id: exitId, appearances: 1, firstSeen: track.date });
    }
  }

  for (const [url, data] of exitNodesByUrl) {
    const platform = detectPlatform(url);
    nodeMap.set(data.id, {
      id: data.id,
      type: 'exit',
      url,
      platform,
      label: getPlatformLabel(platform),
      firstSeen: data.firstSeen,
      appearances: data.appearances,
    });
  }

  // === Build dispatch nodes (only notable dispatches) ===
  for (const dispatch of dispatches) {
    const id = `d:${dispatch.date}`;
    nodeMap.set(id, {
      id,
      type: 'dispatch',
      date: dispatch.date,
      announcements: dispatch.announcements,
      hasProseLinks: dispatch.hasProseLinks,
      firstSeen: dispatch.date,
      appearances: 1,
    });
  }

  // === Build track↔track edges (musical) ===
  const trackList = tracks.map(t => ({
    ...t,
    id: createNodeId(t.artist, t.title),
  }));

  for (let i = 0; i < trackList.length; i++) {
    for (let j = i + 1; j < trackList.length; j++) {
      const a = trackList[i];
      const b = trackList[j];

      if (a.id === b.id) continue;

      const edgeKey = [a.id, b.id].sort().join('|');
      const existing = edgeMap.get(edgeKey) || { weight: 0, reasons: new Set<string>(), edgeType: 'musical' as EdgeType };

      // Same dispatch
      if (a.date.slice(0, 10) === b.date.slice(0, 10)) {
        existing.weight += 1.0;
        existing.reasons.add('same dispatch');
      } else {
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

      // Harmonic (Camelot)
      if (a.openKey && b.openKey && a.openKey === b.openKey) {
        existing.weight += 0.3;
        existing.reasons.add('harmonic');
      }

      // Same meter (non-4/4)
      if (a.timeSignature && b.timeSignature && a.timeSignature === b.timeSignature && a.timeSignature !== '4/4') {
        existing.weight += 0.2;
        existing.reasons.add('same meter');
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

  // === Build article↔article edges (wikilinks) ===
  // Citation type priority for aggregation: block > text > heading > section
  const citationPriority: Record<CitationType, number> = {
    block: 4,
    text: 3,
    heading: 2,
    section: 1,
  };

  for (const article of articles) {
    const sourceId = `a:${article.slug}`;
    for (const wikilink of article.wikilinks) {
      // Only link to journal articles for now
      if (wikilink.target.startsWith('journal:')) {
        const slug = wikilink.target.replace('journal:', '');
        const targetId = `a:${slug}`;
        if (nodeMap.has(targetId)) {
          const edgeKey = [sourceId, targetId].sort().join('|');
          const existing = edgeMap.get(edgeKey);
          if (existing) {
            existing.weight = Math.max(existing.weight, 1.0);
            existing.reasons.add('cites');
            existing.citationCount = (existing.citationCount || 1) + 1;
            // Keep most specific citation type
            if (existing.citationType && citationPriority[wikilink.citationType] > citationPriority[existing.citationType]) {
              existing.citationType = wikilink.citationType;
            }
          } else {
            edgeMap.set(edgeKey, {
              weight: 1.0,
              reasons: new Set(['cites']),
              edgeType: 'wikilink',
              citationType: wikilink.citationType,
              citationCount: 1,
            });
          }
        }
      }
    }
  }

  // === Build article↔cultivation edges (wikilinks) ===
  for (const cult of cultivations) {
    const sourceId = `c:${cult.slug}`;
    for (const wikilink of cult.wikilinks) {
      if (wikilink.target.startsWith('journal:')) {
        const slug = wikilink.target.replace('journal:', '');
        const targetId = `a:${slug}`;
        if (nodeMap.has(targetId)) {
          const edgeKey = [sourceId, targetId].sort().join('|');
          const existing = edgeMap.get(edgeKey);
          if (existing) {
            existing.citationCount = (existing.citationCount || 1) + 1;
            if (existing.citationType && citationPriority[wikilink.citationType] > citationPriority[existing.citationType]) {
              existing.citationType = wikilink.citationType;
            }
          } else {
            edgeMap.set(edgeKey, {
              weight: 0.8,
              reasons: new Set(['references']),
              edgeType: 'wikilink',
              citationType: wikilink.citationType,
              citationCount: 1,
            });
          }
        }
      }
    }
  }

  // === Build track↔article edges (announced together) ===
  // Group tracks by dispatch date
  const tracksByDate = new Map<string, string[]>(); // date -> track ids
  for (const track of tracks) {
    const dateKey = track.date.slice(0, 10);
    const id = createNodeId(track.artist, track.title);
    const list = tracksByDate.get(dateKey) || [];
    if (!list.includes(id)) list.push(id);
    tracksByDate.set(dateKey, list);
  }

  // Link articles to tracks from the same dispatch they were announced in
  for (const link of ahoraLinks) {
    const articleId = `a:${link.articleSlug}`;
    if (!nodeMap.has(articleId)) continue;

    const dateKey = link.date.slice(0, 10);
    const trackIds = tracksByDate.get(dateKey) || [];

    for (const trackId of trackIds) {
      const edgeKey = [articleId, trackId].sort().join('|');
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, { weight: 0.8, reasons: new Set(['announced together']), edgeType: 'announced' });
      }
    }
  }

  // === Build track↔exit edges ===
  for (const track of tracks) {
    if (!track.url) continue;
    const trackId = createNodeId(track.artist, track.title);
    const exitId = createExitNodeId(track.url);
    if (!nodeMap.has(exitId)) continue;

    const edgeKey = [trackId, exitId].sort().join('|');
    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, { weight: 0.6, reasons: new Set(['links to']), edgeType: 'exit' });
    }
  }

  // === Build dispatch edges ===
  for (const dispatch of dispatches) {
    const dispatchId = `d:${dispatch.date}`;
    if (!nodeMap.has(dispatchId)) continue;

    const dateKey = dispatch.date.slice(0, 10);

    // Dispatch → tracks (context): weight 0.5
    const trackIds = tracksByDate.get(dateKey) || [];
    for (const trackId of trackIds) {
      const edgeKey = [dispatchId, trackId].sort().join('|');
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, { weight: 0.5, reasons: new Set(['context']), edgeType: 'context' });
      }
    }

    // Dispatch → articles (announced): weight 1.0 via ahoraLinks
    for (const link of ahoraLinks) {
      if (link.date.slice(0, 10) === dateKey) {
        const articleId = `a:${link.articleSlug}`;
        if (nodeMap.has(articleId)) {
          const edgeKey = [dispatchId, articleId].sort().join('|');
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, { weight: 1.0, reasons: new Set(['announces']), edgeType: 'announced' });
          }
        }
      }
    }

    // Dispatch → articles (prose wikilinks): weight 0.8
    for (const wikilink of dispatch.proseWikilinks) {
      if (wikilink.target.startsWith('journal:')) {
        const slug = wikilink.target.replace('journal:', '');
        const articleId = `a:${slug}`;
        if (nodeMap.has(articleId)) {
          const edgeKey = [dispatchId, articleId].sort().join('|');
          const existing = edgeMap.get(edgeKey);
          if (existing) {
            existing.reasons.add('cites');
            existing.citationCount = (existing.citationCount || 1) + 1;
            if (existing.citationType && citationPriority[wikilink.citationType] > citationPriority[existing.citationType]) {
              existing.citationType = wikilink.citationType;
            }
          } else {
            edgeMap.set(edgeKey, {
              weight: 0.8,
              reasons: new Set(['cites']),
              edgeType: 'wikilink',
              citationType: wikilink.citationType,
              citationCount: 1,
            });
          }
        }
      }
    }

    // Dispatch → exit nodes (prose external links): weight 0.6
    for (const url of dispatch.proseExternalLinks) {
      const exitId = createExitNodeId(url);
      // Create exit node if it doesn't exist
      if (!nodeMap.has(exitId)) {
        const platform = detectPlatform(url);
        nodeMap.set(exitId, {
          id: exitId,
          type: 'exit',
          url,
          platform,
          label: getPlatformLabel(platform),
          firstSeen: dispatch.date,
          appearances: 1,
        });
      }
      const edgeKey = [dispatchId, exitId].sort().join('|');
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, { weight: 0.6, reasons: new Set(['links to']), edgeType: 'exit' });
      }
    }
  }

  // === Convert and filter edges ===
  const edges: MyceliumEdge[] = [];
  for (const [key, data] of edgeMap) {
    if (data.weight >= 0.3) {
      const [source, target] = key.split('|');
      const edge: MyceliumEdge = {
        source,
        target,
        weight: Math.round(data.weight * 100) / 100,
        reasons: Array.from(data.reasons),
        edgeType: data.edgeType,
      };
      // Include citation data for wikilink edges
      if (data.edgeType === 'wikilink' && data.citationType) {
        edge.citationType = data.citationType;
        if (data.citationCount && data.citationCount > 1) {
          edge.citationCount = data.citationCount;
        }
      }
      edges.push(edge);
    }
  }

  const nodesArray = Array.from(nodeMap.values());
  const trackNodes = nodesArray.filter(n => n.type === 'track');
  const tracksFromSongbpm = trackNodes.filter(n => n.songbpmId).length;
  const dispatchCount = nodesArray.filter(n => n.type === 'dispatch').length;
  const exitCount = nodesArray.filter(n => n.type === 'exit').length;

  return {
    nodes: nodesArray,
    edges,
    generated: new Date().toISOString(),
    meta: {
      tracksFromSongbpm,
      articleCount: articles.length,
      cultivationCount: cultivations.length,
      dispatchCount,
      exitCount,
    },
  };
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use buildGraph with GraphInput instead
 */
export function buildGraphFromTracks(tracks: TrackData[]): MyceliumGraph {
  return buildGraph({
    tracks,
    articles: [],
    cultivations: [],
    ahoraLinks: [],
  });
}
