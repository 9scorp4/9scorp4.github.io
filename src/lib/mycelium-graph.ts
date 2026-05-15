/**
 * Mycelium Graph - builds connection graph from dispatches, articles, cultivations
 *
 * Songs and writings connect where they touched: same dispatch, temporal proximity,
 * wikilinks, announcements, same artist, similar BPM, harmonic compatibility.
 *
 * This file orchestrates the graph building process and re-exports all types
 * and utilities for backward compatibility.
 */

// Re-export all types
export type {
  NodeType,
  EdgeType,
  CitationType,
  MyceliumNode,
  MyceliumEdge,
  MyceliumGraph,
  TrackData,
  WikilinkData,
  ArticleData,
  CultivationData,
  SpecimenData,
  AhoraLink,
  CultivandoLink,
  SpecimenLink,
  DispatchData,
  GraphInput,
} from './mycelium-graph/index.ts';

// Re-export utilities
export {
  detectPlatform,
  createExitNodeId,
  createNodeId,
  daysBetween,
  similarBpm,
  normalizeKey,
} from './mycelium-graph/index.ts';

// Import builders for graph construction
import type { MyceliumNode, MyceliumGraph, GraphInput, EdgeData } from './mycelium-graph/types.ts';
import {
  buildTrackNodes,
  buildArticleNodes,
  buildCultivationNodes,
  buildExitNodesFromTracks,
  buildDispatchNodes,
  buildSpecimenNodes,
} from './mycelium-graph/node-builders.ts';
import {
  buildMusicalEdges,
  buildArticleWikilinkEdges,
  buildCultivationWikilinkEdges,
  buildAnnouncedEdges,
  buildTrackExitEdges,
  buildDispatchEdges,
  finalizeEdges,
} from './mycelium-graph/edge-builders.ts';

/**
 * Build the unified mycelium graph from tracks, articles, and cultivations
 */
export function buildGraph(input: GraphInput): MyceliumGraph {
  const nodeMap = new Map<string, MyceliumNode>();
  const edgeMap = new Map<string, EdgeData>();

  const {
    tracks,
    articles,
    cultivations,
    specimens = [],
    ahoraLinks,
    cultivandoLinks = [],
    specimenLinks = [],
    dispatches = [],
  } = input;

  // Build all nodes
  buildTrackNodes(tracks, nodeMap);
  buildArticleNodes(articles, nodeMap);
  buildCultivationNodes(cultivations, nodeMap);
  buildSpecimenNodes(specimens, nodeMap);
  buildExitNodesFromTracks(tracks, nodeMap);
  buildDispatchNodes(dispatches, nodeMap);

  // Build all edges
  buildMusicalEdges(tracks, edgeMap);
  buildArticleWikilinkEdges(articles, nodeMap, edgeMap);
  buildCultivationWikilinkEdges(cultivations, nodeMap, edgeMap);
  const tracksByDate = buildAnnouncedEdges(tracks, ahoraLinks, cultivandoLinks, nodeMap, edgeMap);
  buildTrackExitEdges(tracks, nodeMap, edgeMap);
  buildDispatchEdges(dispatches, ahoraLinks, cultivandoLinks, specimenLinks, tracksByDate, nodeMap, edgeMap);

  // Finalize
  const edges = finalizeEdges(edgeMap);
  const nodesArray = Array.from(nodeMap.values());
  const trackNodes = nodesArray.filter(n => n.type === 'track');
  const tracksFromSongbpm = trackNodes.filter(n => n.songbpmId).length;
  const dispatchCount = nodesArray.filter(n => n.type === 'dispatch').length;
  const exitCount = nodesArray.filter(n => n.type === 'exit').length;
  const specimenCount = nodesArray.filter(n => n.type === 'specimen').length;

  return {
    nodes: nodesArray,
    edges,
    generated: new Date().toISOString(),
    meta: {
      tracksFromSongbpm,
      articleCount: articles.length,
      cultivationCount: cultivations.length,
      specimenCount,
      dispatchCount,
      exitCount,
    },
  };
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use buildGraph with GraphInput instead
 */
export function buildGraphFromTracks(tracks: import('./mycelium-graph/types.ts').TrackData[]): MyceliumGraph {
  return buildGraph({
    tracks,
    articles: [],
    cultivations: [],
    ahoraLinks: [],
  });
}
