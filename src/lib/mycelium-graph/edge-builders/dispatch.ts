/**
 * Dispatch edge building functions (announced, context, track-exit).
 */

import type {
  MyceliumNode,
  TrackData,
  AhoraLink,
  CultivandoLink,
  SpecimenLink,
  DispatchData,
  EdgeData,
} from '../types.ts';
import {
  createNodeId,
  createExitNodeId,
  detectPlatform,
  getPlatformLabel,
} from '../utilities.ts';
import { citationPriority } from './constants.ts';

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
  specimenLinks: SpecimenLink[],
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

    // Dispatch → specimens (specimenNuevo): weight 1.0 via specimenLinks
    for (const link of specimenLinks) {
      if (link.date.slice(0, 10) === dateKey) {
        const specId = `s:${link.specimenId}`;
        if (nodeMap.has(specId)) {
          const edgeKey = [dispatchId, specId].sort().join('|');
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
}
