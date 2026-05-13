/**
 * Touch event handlers for MyceliumCanvas.
 * Supports pinch-to-zoom and single-touch drag/pan.
 */

import type { Simulation } from 'd3-force';
import type { SimNode, SimLink, Transform } from './types';
import { getCanvasCoords, screenToWorld, findNodeAt, zoomAt, getTouchDistance, getTouchCenter } from './interactions';
import { showDetail } from './detail-panel';

export interface TouchHandlerContext {
  canvas: HTMLCanvasElement;
  detailPanel: HTMLDivElement;
  getNodes: () => SimNode[];
  getLinks: () => SimLink[];
  getTransform: () => Transform;
  setTransform: (t: Transform) => void;
  getSimulation: () => Simulation<SimNode, SimLink> | null;
  setSelectedNode: (node: SimNode | null) => void;
  getDraggedNode: () => SimNode | null;
  setDraggedNode: (node: SimNode | null) => void;
  render: () => void;
}

interface TouchState {
  isPanning: boolean;
  panStart: { x: number; y: number };
  transformStart: { x: number; y: number };
  lastPinchDistance: number;
  lastPinchCenter: { x: number; y: number };
}

/** Attach touch event handlers to canvas */
export function attachTouchHandlers(ctx: TouchHandlerContext): () => void {
  const {
    canvas, detailPanel, getNodes, getLinks, getTransform, setTransform,
    getSimulation, setSelectedNode, getDraggedNode, setDraggedNode, render,
  } = ctx;

  const state: TouchState = {
    isPanning: false,
    panStart: { x: 0, y: 0 },
    transformStart: { x: 0, y: 0 },
    lastPinchDistance: 0,
    lastPinchCenter: { x: 0, y: 0 },
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const transform = getTransform();
    const nodes = getNodes();
    const links = getLinks();
    const simulation = getSimulation();

    if (e.touches.length === 2) {
      state.lastPinchDistance = getTouchDistance(e.touches);
      state.lastPinchCenter = getTouchCenter(canvas, e.touches);
      state.isPanning = false;
      setDraggedNode(null);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(canvas, touch);
      const node = findNodeAt(x, y, nodes, transform);

      if (node) {
        setDraggedNode(node);
        setSelectedNode(node);
        const world = screenToWorld(x, y, transform);
        node.fx = world.x;
        node.fy = world.y;
        showDetail(detailPanel, node, links);
        simulation?.alphaTarget(0.3).restart();
      } else {
        state.isPanning = true;
        state.panStart = { x, y };
        state.transformStart = { x: transform.x, y: transform.y };
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const transform = getTransform();
    const simulation = getSimulation();
    const draggedNode = getDraggedNode();

    if (e.touches.length === 2) {
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(canvas, e.touches);

      if (state.lastPinchDistance > 0) {
        const scaleDelta = (state.lastPinchDistance - newDistance) * 0.01;
        setTransform(zoomAt(transform, newCenter.x, newCenter.y, scaleDelta));
        render();
      }

      state.lastPinchDistance = newDistance;
      state.lastPinchCenter = newCenter;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(canvas, touch);

      if (state.isPanning) {
        setTransform({
          ...transform,
          x: state.transformStart.x + (x - state.panStart.x),
          y: state.transformStart.y + (y - state.panStart.y),
        });
        render();
      } else if (draggedNode) {
        const world = screenToWorld(x, y, transform);
        draggedNode.fx = world.x;
        draggedNode.fy = world.y;
        simulation?.alpha(0.3).restart();
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const transform = getTransform();
    const simulation = getSimulation();
    const draggedNode = getDraggedNode();

    if (e.touches.length === 0) {
      if (draggedNode) {
        draggedNode.fx = null;
        draggedNode.fy = null;
        setDraggedNode(null);
        simulation?.alphaTarget(0);
      }
      state.isPanning = false;
      state.lastPinchDistance = 0;
    } else if (e.touches.length === 1) {
      state.lastPinchDistance = 0;
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(canvas, touch);
      state.isPanning = true;
      state.panStart = { x, y };
      state.transformStart = { x: transform.x, y: transform.y };
    }
  };

  // Attach listeners
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
  };
}
