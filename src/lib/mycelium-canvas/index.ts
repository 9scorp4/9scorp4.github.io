/**
 * MyceliumCanvas module - force-directed graph visualization utilities.
 */

// Types
export type {
  SimNode,
  SimLink,
  Transform,
  Point,
  MyceliumNode,
  MyceliumEdge,
  MyceliumGraph,
  NodeType,
  EdgeType,
  CitationType,
} from './types';

// Constants
export { COLORS, CITATION_DASH_PATTERNS, ZOOM } from './constants';

// Rendering
export {
  getNodeSize,
  getNodeColor,
  getEdgeColor,
  getNodeLabel,
  isNodeInViewport,
  draw,
} from './rendering';

// Detail panel
export { getStatusSymbol, showDetail, hideDetail } from './detail-panel';

// Interactions
export {
  getCanvasCoords,
  screenToWorld,
  worldToScreen,
  isInViewport,
  findNodeAt,
  zoomAt,
  getTouchDistance,
  getTouchCenter,
} from './interactions';

// Tracking
export { trackNodeClick } from './tracking';

// Event handlers
export { attachMouseHandlers } from './mouse-handler';
export type { MouseHandlerContext } from './mouse-handler';
export { attachTouchHandlers } from './touch-handler';
export type { TouchHandlerContext } from './touch-handler';

// Graph loading
export { loadGraph, updateSimulationForResize } from './graph-loader';
export type { GraphLoaderOptions, GraphLoadResult } from './graph-loader';
