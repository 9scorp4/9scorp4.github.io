/**
 * Edge finalization function.
 */

import type { MyceliumEdge, EdgeData } from '../types.ts';

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
