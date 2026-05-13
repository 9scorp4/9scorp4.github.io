/**
 * Mycelium Graph barrel file.
 * Re-exports all types, utilities, and builders.
 */

// Types
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
  AhoraLink,
  CultivandoLink,
  DispatchData,
  GraphInput,
  EdgeData,
} from './types.ts';

// Utilities
export {
  detectPlatform,
  getPlatformLabel,
  createExitNodeId,
  createNodeId,
  daysBetween,
  similarBpm,
  normalizeKey,
  similarDanceability,
  sharedGenre,
} from './utilities.ts';

// Node builders
export {
  buildTrackNodes,
  buildArticleNodes,
  buildCultivationNodes,
  buildExitNodesFromTracks,
  buildDispatchNodes,
} from './node-builders.ts';

// Edge builders
export {
  buildMusicalEdges,
  buildArticleWikilinkEdges,
  buildCultivationWikilinkEdges,
  buildAnnouncedEdges,
  buildTrackExitEdges,
  buildDispatchEdges,
  finalizeEdges,
} from './edge-builders.ts';
