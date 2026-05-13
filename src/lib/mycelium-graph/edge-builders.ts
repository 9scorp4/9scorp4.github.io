/**
 * Edge building functions for the Mycelium graph system.
 */

import type {
  MyceliumNode,
  MyceliumEdge,
  TrackData,
  ArticleData,
  CultivationData,
  AhoraLink,
  CultivandoLink,
  DispatchData,
  EdgeData,
  EdgeType,
  CitationType,
} from './types.ts';
import {
  createNodeId,
  createExitNodeId,
  detectPlatform,
  getPlatformLabel,
  daysBetween,
  similarBpm,
  normalizeKey,
  similarDanceability,
  sharedGenre,
} from './utilities.ts';

/** Citation type priority for aggregation: block > text > heading > section */
const citationPriority: Record<CitationType, number> = {
  block: 4,
  text: 3,
  heading: 2,
  section: 1,
};

/**
 * Build track↔track edges (musical connections)
 */
export function buildMusicalEdges(
  tracks: TrackData[],
  edgeMap: Map<string, EdgeData>
): void {
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
}

/**
 * Build article↔article edges (wikilinks)
 */
export function buildArticleWikilinkEdges(
  articles: ArticleData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
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
}

/**
 * Build cultivation↔article edges (wikilinks)
 */
export function buildCultivationWikilinkEdges(
  cultivations: CultivationData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
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
}

/**
 * Build track↔article edges (announced together)
 */
export function buildAnnouncedEdges(
  tracks: TrackData[],
  ahoraLinks: AhoraLink[],
  cultivandoLinks: CultivandoLink[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): Map<string, string[]> {
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

  // Link cultivations to tracks from the same dispatch they were mentioned in
  for (const link of cultivandoLinks) {
    const cultId = `c:${link.cultivationSlug}`;
    if (!nodeMap.has(cultId)) continue;

    const dateKey = link.date.slice(0, 10);
    const trackIds = tracksByDate.get(dateKey) || [];

    for (const trackId of trackIds) {
      const edgeKey = [cultId, trackId].sort().join('|');
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, { weight: 0.8, reasons: new Set(['announced together']), edgeType: 'announced' });
      }
    }
  }

  return tracksByDate;
}

/**
 * Build track↔exit edges
 */
export function buildTrackExitEdges(
  tracks: TrackData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
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
}

/**
 * Build dispatch edges (context, announcements, wikilinks, external links)
 */
export function buildDispatchEdges(
  dispatches: DispatchData[],
  ahoraLinks: AhoraLink[],
  cultivandoLinks: CultivandoLink[],
  tracksByDate: Map<string, string[]>,
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
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

    // Dispatch → cultivations (cultivando): weight 1.0 via cultivandoLinks
    for (const link of cultivandoLinks) {
      if (link.date.slice(0, 10) === dateKey) {
        const cultId = `c:${link.cultivationSlug}`;
        if (nodeMap.has(cultId)) {
          const edgeKey = [dispatchId, cultId].sort().join('|');
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, { weight: 1.0, reasons: new Set(['cultivando']), edgeType: 'announced' });
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
}

/**
 * Convert edge map to final edge array, filtering by weight threshold
 */
export function finalizeEdges(edgeMap: Map<string, EdgeData>): MyceliumEdge[] {
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
  return edges;
}
