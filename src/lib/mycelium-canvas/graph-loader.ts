/**
 * Graph data loading and simulation setup for MyceliumCanvas.
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceRadial,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';

import type { SimNode, SimLink, MyceliumGraph } from './types';
import { getNodeSize } from './rendering';

export interface GraphLoaderOptions {
  canvasWidth: number;
  canvasHeight: number;
  prefersReducedMotion: boolean;
  onTick: () => void;
}

export interface GraphLoadResult {
  nodes: SimNode[];
  links: SimLink[];
  simulation: Simulation<SimNode, SimLink>;
}

/** Load graph data and create d3-force simulation */
export async function loadGraph(options: GraphLoaderOptions): Promise<GraphLoadResult | null> {
  const { canvasWidth: w, canvasHeight: h, prefersReducedMotion, onTick } = options;

  const response = await fetch('/mycelium-data.json');
  const data: MyceliumGraph = await response.json();

  if (data.nodes.length === 0) {
    return null;
  }

  // Create simulation nodes
  const nodes: SimNode[] = data.nodes.map(n => ({
    ...n,
    x: w / 2 + (Math.random() - 0.5) * 100,
    y: h / 2 + (Math.random() - 0.5) * 100,
  }));

  // Create node lookup for link resolution
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Create simulation links
  const links: SimLink[] = data.edges
    .map(e => ({
      source: nodeById.get(e.source)!,
      target: nodeById.get(e.target)!,
      weight: e.weight,
      reasons: e.reasons,
      edgeType: e.edgeType || 'musical',
      citationType: e.citationType,
      citationCount: e.citationCount,
    }))
    .filter(l => l.source && l.target);

  // Create simulation with tuned parameters
  const simulation = forceSimulation<SimNode>(nodes)
    .force('link', forceLink<SimNode, SimLink>(links)
      .id(d => d.id)
      .distance(l => {
        if (l.edgeType === 'wikilink') return 60;
        if (l.edgeType === 'announced') return 70;
        if (l.edgeType === 'exit') return 120;
        if (l.edgeType === 'context') return 80;
        return 60;
      })
      .strength(l => {
        if (l.edgeType === 'exit') return 0.8;
        return l.weight * 0.3;
      }))
    .force('charge', forceManyBody<SimNode>()
      .strength(d => d.type === 'exit' ? -50 : -150))
    .force('center', forceCenter(w / 2, h / 2))
    .force('gravityX', forceX<SimNode>(w / 2).strength(d => d.type === 'exit' ? 0 : 0.05))
    .force('gravityY', forceY<SimNode>(h / 2).strength(d => d.type === 'exit' ? 0 : 0.05))
    .force('radial', forceRadial<SimNode>(
      d => d.type === 'exit' ? Math.max(w, h) * 0.4 : 0,
      w / 2,
      h / 2
    ).strength(d => d.type === 'exit' ? 0.3 : 0))
    .force('collide', forceCollide<SimNode>().radius(d => getNodeSize(d) + 4))
    .on('tick', onTick);

  if (prefersReducedMotion) {
    simulation.stop();
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }
    // Call onTick once to render the final state
    onTick();
  }

  return { nodes, links, simulation };
}

/** Update simulation forces for new canvas dimensions */
export function updateSimulationForResize(
  simulation: Simulation<SimNode, SimLink>,
  width: number,
  height: number
): void {
  simulation.force('center', forceCenter(width / 2, height / 2));
  simulation.force('gravityX', forceX(width / 2).strength(0.05));
  simulation.force('gravityY', forceY(height / 2).strength(0.05));
  simulation.alpha(0.3).restart();
}
