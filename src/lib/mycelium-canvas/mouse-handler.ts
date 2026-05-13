/**
 * Mouse event handlers for MyceliumCanvas.
 */

import type { Simulation } from 'd3-force';
import type { SimNode, SimLink, Transform } from './types';
import { getCanvasCoords, screenToWorld, findNodeAt, zoomAt } from './interactions';
import { showDetail, hideDetail } from './detail-panel';
import { ZOOM } from './constants';
import { trackNodeClick } from './tracking';

export interface MouseHandlerContext {
  canvas: HTMLCanvasElement;
  detailPanel: HTMLDivElement;
  getNodes: () => SimNode[];
  getLinks: () => SimLink[];
  getTransform: () => Transform;
  setTransform: (t: Transform) => void;
  getSimulation: () => Simulation<SimNode, SimLink> | null;
  getSelectedNode: () => SimNode | null;
  setSelectedNode: (node: SimNode | null) => void;
  getHoveredNode: () => SimNode | null;
  setHoveredNode: (node: SimNode | null) => void;
  getDraggedNode: () => SimNode | null;
  setDraggedNode: (node: SimNode | null) => void;
  render: () => void;
  workerUrl: string;
}

interface PanState {
  isPanning: boolean;
  panStart: { x: number; y: number };
  transformStart: { x: number; y: number };
}

/** Attach mouse event handlers to canvas */
export function attachMouseHandlers(ctx: MouseHandlerContext): () => void {
  const {
    canvas, detailPanel, getNodes, getLinks, getTransform, setTransform,
    getSimulation, getSelectedNode, setSelectedNode, getHoveredNode,
    setHoveredNode, getDraggedNode, setDraggedNode, render, workerUrl,
  } = ctx;

  const panState: PanState = {
    isPanning: false,
    panStart: { x: 0, y: 0 },
    transformStart: { x: 0, y: 0 },
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { x, y } = getCanvasCoords(canvas, e);
    const transform = getTransform();
    const simulation = getSimulation();
    const nodes = getNodes();
    const draggedNode = getDraggedNode();
    const hoveredNode = getHoveredNode();

    if (panState.isPanning) {
      setTransform({
        ...transform,
        x: panState.transformStart.x + (x - panState.panStart.x),
        y: panState.transformStart.y + (y - panState.panStart.y),
      });
      render();
      return;
    }

    if (draggedNode) {
      const world = screenToWorld(x, y, transform);
      draggedNode.fx = world.x;
      draggedNode.fy = world.y;
      simulation?.alpha(0.3).restart();
      return;
    }

    const node = findNodeAt(x, y, nodes, transform);
    if (node !== hoveredNode) {
      setHoveredNode(node);
      canvas.style.cursor = node ? 'pointer' : 'grab';
      render();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    const { x, y } = getCanvasCoords(canvas, e);
    const transform = getTransform();
    const simulation = getSimulation();
    const nodes = getNodes();
    const links = getLinks();
    const node = findNodeAt(x, y, nodes, transform);

    if (node) {
      setDraggedNode(node);
      setSelectedNode(node);
      const world = screenToWorld(x, y, transform);
      node.fx = world.x;
      node.fy = world.y;
      showDetail(detailPanel, node, links);
      simulation?.alphaTarget(0.3).restart();
      canvas.style.cursor = 'grabbing';
    } else {
      panState.isPanning = true;
      panState.panStart = { x, y };
      panState.transformStart = { x: transform.x, y: transform.y };
      canvas.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    const draggedNode = getDraggedNode();
    const hoveredNode = getHoveredNode();
    const simulation = getSimulation();

    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
      simulation?.alphaTarget(0);
    }
    panState.isPanning = false;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  };

  const handleMouseLeave = () => {
    const draggedNode = getDraggedNode();
    const simulation = getSimulation();

    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      setDraggedNode(null);
      simulation?.alphaTarget(0);
    }
    panState.isPanning = false;
    setHoveredNode(null);
    render();
  };

  const handleClick = (e: MouseEvent) => {
    if (panState.isPanning) return;

    const { x, y } = getCanvasCoords(canvas, e);
    const transform = getTransform();
    const nodes = getNodes();
    const links = getLinks();
    const node = findNodeAt(x, y, nodes, transform);

    if (node) {
      setSelectedNode(node);
      showDetail(detailPanel, node, links);
      trackNodeClick(workerUrl, node);
    } else {
      setSelectedNode(null);
      hideDetail(detailPanel);
    }
    render();
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(canvas, e);
    const transform = getTransform();
    const delta = e.deltaY * ZOOM.sensitivity;
    setTransform(zoomAt(transform, x, y, delta));
    render();
  };

  const handleDblClick = (e: MouseEvent) => {
    e.preventDefault();
    setTransform({ x: 0, y: 0, scale: 1 });
    render();
  };

  // Attach listeners
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('dblclick', handleDblClick);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('dblclick', handleDblClick);
  };
}
