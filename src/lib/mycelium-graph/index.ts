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
  SpecimenData,
  AhoraLink,
  CultivandoLink,
  SpecimenLink,
  DispatchData,
  ExternalArticleData,
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

// External article utilities
export {
  isArticleDomain,
  extractDomain,
  createExternalArticleId,
  extractTitleFromUrl,
} from './external-articles.ts';

// Node builders
export {
  buildTrackNodes,
  buildArticleNodes,
  buildCultivationNodes,
  buildExitNodesFromTracks,
  buildDispatchNodes,
  buildSpecimenNodes,
  buildExternalArticleNodes,
} from './node-builders.ts';

// Edge builders
export {
  buildMusicalEdges,
  buildArticleWikilinkEdges,
  buildCultivationWikilinkEdges,
  buildAnnouncedEdges,
  buildTrackExitEdges,
  buildDispatchEdges,
  buildExternalArticleCitationEdges,
  finalizeEdges,
} from './edge-builders.ts';
