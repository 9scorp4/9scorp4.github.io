/**
 * Dynamic sketch loading and lifecycle management
 */

import type { SketchModule, SketchInstance, SketchOptions } from './types';

// Vite glob import for lazy-loading sketches
// Each sketch is code-split into its own chunk
const sketchModules = import.meta.glob('../../sketches/**/*.ts') as Record<
  string,
  () => Promise<SketchModule>
>;

// Current running sketch instance
let currentSketch: SketchInstance | null = null;

// Check reduced motion preference once
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

/**
 * Load and start a sketch in the given container
 */
export async function loadSketch(
  sketchPath: string,
  container: HTMLDivElement,
  onLoaded?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  // Clean up previous sketch
  destroySketch();

  // Clear any existing canvas
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  try {
    // Find the matching module from the glob imports
    const modulePath = `../../sketches/${sketchPath}.ts`;
    const moduleLoader = sketchModules[modulePath];

    if (!moduleLoader) {
      throw new Error(`Sketch not found: ${sketchPath}`);
    }

    // Dynamic import of the sketch module
    const module = await moduleLoader();

    if (typeof module.createSketch !== 'function') {
      throw new Error(`Invalid sketch module: missing createSketch function`);
    }

    // Get container dimensions
    const rect = container.getBoundingClientRect();

    const options: SketchOptions = {
      width: rect.width,
      height: rect.height,
      reducedMotion: prefersReducedMotion,
    };

    // Create sketch with container and dimensions
    currentSketch = module.createSketch(container, options);

    // Notify caller that sketch loaded successfully
    onLoaded?.();
  } catch (err) {
    console.error('Failed to load sketch:', sketchPath, err);
    onError?.(err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Destroy the current sketch instance and clean up
 */
export function destroySketch(): void {
  if (currentSketch && typeof currentSketch.remove === 'function') {
    currentSketch.remove();
    currentSketch = null;
  }
}

/**
 * Check if reduced motion is preferred
 */
export function getReducedMotionPreference(): boolean {
  return prefersReducedMotion;
}
