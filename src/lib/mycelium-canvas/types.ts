/**
 * Type definitions for MyceliumCanvas simulation.
 * Extends base types with d3-force position data.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import type {
  MyceliumNode,
  MyceliumEdge,
  MyceliumGraph,
  NodeType,
  EdgeType,
  CitationType,
} from '../mycelium-graph/types';

// Re-export base types for convenience
export type { MyceliumNode, MyceliumEdge, MyceliumGraph, NodeType, EdgeType, CitationType };

/** Simulation node with d3 position data */
export interface SimNode extends SimulationNodeDatum, MyceliumNode {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

/** Simulation link with resolved node references */
export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
  weight: number;
  reasons: string[];
  edgeType: EdgeType;
  citationType?: CitationType;
  citationCount?: number;
}

/** Transform state for pan/zoom */
export interface Transform {
  x: number;
  y: number;
  scale: number;
}

/** Point in 2D space */
export interface Point {
  x: number;
  y: number;
}
