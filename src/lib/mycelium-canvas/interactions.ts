/**
 * Interaction utilities for MyceliumCanvas.
 */

import type { SimNode, Transform, Point } from './types';
import { getNodeSize } from './rendering';
import { ZOOM } from './constants';

/** Get canvas coordinates from mouse/touch event */
export function getCanvasCoords(canvas: HTMLCanvasElement, event: MouseEvent | Touch): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/** Convert screen coordinates to world coordinates */
export function screenToWorld(screenX: number, screenY: number, transform: Transform): Point {
  return {
    x: (screenX - transform.x) / transform.scale,
    y: (screenY - transform.y) / transform.scale,
  };
}

/** Convert world coordinates to screen coordinates */
export function worldToScreen(worldX: number, worldY: number, transform: Transform): Point {
  return {
    x: worldX * transform.scale + transform.x,
    y: worldY * transform.scale + transform.y,
  };
}

/** Check if a node is visible in the viewport */
export function isInViewport(
  node: SimNode,
  canvasWidth: number,
  canvasHeight: number,
  transform: Transform
): boolean {
  const screen = worldToScreen(node.x, node.y, transform);
  const margin = 50;
  return screen.x >= -margin && screen.x <= canvasWidth + margin &&
         screen.y >= -margin && screen.y <= canvasHeight + margin;
}

/** Find node at screen coordinates */
export function findNodeAt(
  screenX: number,
  screenY: number,
  nodes: SimNode[],
  transform: Transform
): SimNode | null {
  const { x, y } = screenToWorld(screenX, screenY, transform);

  // Search in reverse order (top nodes first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.x == null) continue;
    const size = getNodeSize(node);

    if (node.type === 'track' || node.type === 'exit') {
      // Circle hit test
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy <= size * size) {
        return node;
      }
    } else {
      // Square hit test
      if (Math.abs(node.x - x) <= size && Math.abs(node.y - y) <= size) {
        return node;
      }
    }
  }
  return null;
}

/** Calculate zoom centered on a point */
export function zoomAt(
  transform: Transform,
  centerX: number,
  centerY: number,
  delta: number
): Transform {
  const oldScale = transform.scale;
  const newScale = Math.max(ZOOM.min, Math.min(ZOOM.max, oldScale * (1 - delta)));

  return {
    x: centerX - (centerX - transform.x) * (newScale / oldScale),
    y: centerY - (centerY - transform.y) * (newScale / oldScale),
    scale: newScale,
  };
}

/** Get distance between two touches */
export function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Get center point between two touches */
export function getTouchCenter(canvas: HTMLCanvasElement, touches: TouchList): Point {
  if (touches.length < 2) {
    return getCanvasCoords(canvas, touches[0]);
  }
  const rect = canvas.getBoundingClientRect();
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  };
}
