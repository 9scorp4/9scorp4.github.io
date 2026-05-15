/**
 * Canvas rendering functions for MyceliumCanvas.
 */

import type { SimNode, SimLink, Transform, EdgeType } from './types';
import { COLORS, CITATION_DASH_PATTERNS, ZOOM } from './constants';

/** Get node size based on type and appearances */
export function getNodeSize(node: SimNode): number {
  if (node.type === 'track') {
    return 6 + Math.min(node.appearances * 2, 8);
  } else if (node.type === 'article') {
    return 10;
  } else if (node.type === 'specimen') {
    return 9;
  } else if (node.type === 'dispatch') {
    return 7;
  } else if (node.type === 'exit') {
    return 6;
  } else {
    return 8; // cultivation
  }
}

/** Get node color based on type and active state */
export function getNodeColor(node: SimNode, isActive: boolean): string {
  if (isActive) return COLORS.sun;
  if (node.type === 'track') return COLORS.fern;
  if (node.type === 'specimen') return COLORS.fern;
  if (node.type === 'cultivation') return COLORS.ochreMuted;
  if (node.type === 'dispatch') return COLORS.inkSoft;
  if (node.type === 'exit') return COLORS.inkFaint;
  return COLORS.ochre; // article
}

/** Get edge color based on type */
export function getEdgeColor(edgeType: EdgeType): string {
  if (edgeType === 'wikilink' || edgeType === 'announced' || edgeType === 'context') {
    return COLORS.ochre;
  }
  return COLORS.paperLine;
}

/** Get node label for display */
export function getNodeLabel(node: SimNode): { primary: string; secondary?: string } {
  if (node.type === 'track') {
    return { primary: node.title || '', secondary: node.artist };
  } else if (node.type === 'article') {
    return { primary: node.articleTitle || node.slug || '' };
  } else if (node.type === 'specimen') {
    return { primary: node.specimenName || node.slug || '', secondary: node.specimenSeries };
  } else if (node.type === 'dispatch') {
    const date = new Date(node.date + 'T00:00:00');
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { primary: formatted };
  } else if (node.type === 'exit') {
    return { primary: node.label || 'external' };
  } else {
    return { primary: node.cultivationName || node.slug || '' };
  }
}

/** Check if a node is visible in the viewport */
export function isNodeInViewport(
  node: SimNode,
  canvasWidth: number,
  canvasHeight: number,
  transform: Transform
): boolean {
  const screenX = node.x * transform.scale + transform.x;
  const screenY = node.y * transform.scale + transform.y;
  const margin = 50;
  return screenX >= -margin && screenX <= canvasWidth + margin &&
         screenY >= -margin && screenY <= canvasHeight + margin;
}

interface DrawOptions {
  ctx: CanvasRenderingContext2D;
  nodes: SimNode[];
  links: SimLink[];
  transform: Transform;
  hoveredNode: SimNode | null;
  selectedNode: SimNode | null;
  canvasWidth: number;
  canvasHeight: number;
}

/** Main draw function */
export function draw(options: DrawOptions): void {
  const { ctx, nodes, links, transform, hoveredNode, selectedNode, canvasWidth, canvasHeight } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);

  // Draw edges
  drawEdges(ctx, links, transform);

  // Draw weight labels when zoomed in
  if (transform.scale >= ZOOM.weightLabelThreshold) {
    drawWeightLabels(ctx, links, transform, canvasWidth, canvasHeight);
  }

  // Draw nodes
  drawNodes(ctx, nodes, transform, hoveredNode, selectedNode);

  ctx.restore();
}

function drawEdges(ctx: CanvasRenderingContext2D, links: SimLink[], transform: Transform): void {
  for (const link of links) {
    if (link.source.x == null || link.target.x == null) continue;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = getEdgeColor(link.edgeType);
    ctx.lineWidth = Math.min(link.weight, 2) / transform.scale;

    if (link.edgeType === 'exit') {
      const dashLength = 4 / transform.scale;
      ctx.setLineDash([dashLength, dashLength]);
    } else if (link.edgeType === 'wikilink' && link.citationType) {
      const pattern = CITATION_DASH_PATTERNS[link.citationType];
      ctx.setLineDash(pattern.map(v => v / transform.scale));
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawWeightLabels(
  ctx: CanvasRenderingContext2D,
  links: SimLink[],
  transform: Transform,
  canvasWidth: number,
  canvasHeight: number
): void {
  const fontSize = 10 / transform.scale;
  ctx.font = `${fontSize}px Junicode, "IM Fell DW Pica", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const link of links) {
    const source = link.source;
    const target = link.target;
    if (!isNodeInViewport(source, canvasWidth, canvasHeight, transform) &&
        !isNodeInViewport(target, canvasWidth, canvasHeight, transform)) continue;

    const mx = (source.x! + target.x!) / 2;
    const my = (source.y! + target.y!) / 2;

    const label = link.weight.toFixed(1);
    const metrics = ctx.measureText(label);
    const pad = 2 / transform.scale;

    ctx.fillStyle = COLORS.paper + 'cc';
    ctx.fillRect(
      mx - metrics.width / 2 - pad,
      my - fontSize / 2 - pad,
      metrics.width + pad * 2,
      fontSize + pad * 2
    );

    ctx.fillStyle = COLORS.inkFaint;
    ctx.fillText(label, mx, my);
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  nodes: SimNode[],
  transform: Transform,
  hoveredNode: SimNode | null,
  selectedNode: SimNode | null
): void {
  for (const node of nodes) {
    if (node.x == null) continue;

    const isHovered = node === hoveredNode;
    const isSelected = node === selectedNode;
    const size = getNodeSize(node);
    const color = getNodeColor(node, isSelected || isHovered);

    ctx.fillStyle = color;

    if (node.type === 'track') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === 'exit') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / transform.scale;
      ctx.stroke();
    } else if (node.type === 'specimen') {
      // Hexagon shape for specimens
      drawHexagon(ctx, node.x, node.y, size);
      ctx.fill();
    } else if (node.type === 'dispatch') {
      const halfSize = size;
      const cornerRadius = 1;
      ctx.beginPath();
      ctx.roundRect(node.x - halfSize, node.y - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
      ctx.fill();
    } else {
      const halfSize = size;
      const cornerRadius = 2;
      ctx.beginPath();
      ctx.roundRect(node.x - halfSize, node.y - halfSize, halfSize * 2, halfSize * 2, cornerRadius);
      ctx.fill();
    }

    // Draw label on hover/select
    if (isHovered || isSelected) {
      drawNodeLabel(ctx, node, size, transform);
    }
  }
}

/** Draw a hexagon at the given position */
function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // Start flat-topped
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  node: SimNode,
  size: number,
  transform: Transform
): void {
  const label = getNodeLabel(node);
  const fontSize = 14 / transform.scale;
  const smallFontSize = 12 / transform.scale;

  ctx.font = `${fontSize}px "IM Fell DW Pica", Georgia, serif`;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'center';
  ctx.fillText(label.primary, node.x, node.y - size - 8 / transform.scale);

  if (label.secondary) {
    ctx.font = `${smallFontSize}px "IM Fell DW Pica", Georgia, serif`;
    ctx.fillStyle = COLORS.inkSoft;
    ctx.fillText(label.secondary, node.x, node.y - size - 22 / transform.scale);
  }
}
