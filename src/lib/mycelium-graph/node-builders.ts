/**
 * Node building functions for the Mycelium graph system.
 */

import type { MyceliumNode, TrackData, ArticleData, CultivationData, DispatchData, SpecimenData, ExternalArticleData } from './types.ts';
import { createNodeId, createExitNodeId, detectPlatform, getPlatformLabel } from './utilities.ts';
import { createExternalArticleId, extractDomain, extractTitleFromUrl } from './external-articles.ts';

/**
 * Build track nodes from track data
 */
export function buildTrackNodes(
  tracks: TrackData[],
  nodeMap: Map<string, MyceliumNode>
): void {
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
}

/**
 * Build article nodes from article data
 */
export function buildArticleNodes(
  articles: ArticleData[],
  nodeMap: Map<string, MyceliumNode>
): void {
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
}

/**
 * Build cultivation nodes from cultivation data
 */
export function buildCultivationNodes(
  cultivations: CultivationData[],
  nodeMap: Map<string, MyceliumNode>
): void {
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
}

/**
 * Build exit nodes from track URLs
 */
export function buildExitNodesFromTracks(
  tracks: TrackData[],
  nodeMap: Map<string, MyceliumNode>
): void {
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
}

/**
 * Build dispatch nodes (only notable dispatches)
 */
export function buildDispatchNodes(
  dispatches: DispatchData[],
  nodeMap: Map<string, MyceliumNode>
): void {
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
}

/**
 * Build specimen nodes from specimen data
 */
export function buildSpecimenNodes(
  specimens: SpecimenData[],
  nodeMap: Map<string, MyceliumNode>
): void {
  for (const specimen of specimens) {
    const id = `s:${specimen.id}`;
    nodeMap.set(id, {
      id,
      type: 'specimen',
      slug: specimen.id,
      specimenName: specimen.name,
      specimenStatus: specimen.status,
      specimenSeries: specimen.series,
      firstSeen: specimen.grown,
      appearances: 1,
    });
  }
}

/**
 * Build external article nodes from external article data
 */
export function buildExternalArticleNodes(
  externalArticles: ExternalArticleData[],
  nodeMap: Map<string, MyceliumNode>
): void {
  // Group by URL to aggregate citations
  const byUrl = new Map<string, { data: ExternalArticleData; appearances: number; firstSeen: string }>();

  for (const ext of externalArticles) {
    const existing = byUrl.get(ext.url);
    if (existing) {
      existing.appearances++;
      if (ext.sourceDate < existing.firstSeen) {
        existing.firstSeen = ext.sourceDate;
      }
    } else {
      byUrl.set(ext.url, { data: ext, appearances: 1, firstSeen: ext.sourceDate });
    }
  }

  for (const [url, { data, appearances, firstSeen }] of byUrl) {
    const id = createExternalArticleId(url);
    const domain = extractDomain(url);
    const inferredTitle = extractTitleFromUrl(url);

    nodeMap.set(id, {
      id,
      type: 'externalArticle',
      url,
      externalTitle: data.title || inferredTitle || undefined,
      externalAuthor: data.author,
      externalDomain: domain,
      firstSeen,
      appearances,
    });
  }
}
