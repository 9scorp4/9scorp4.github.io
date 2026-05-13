/**
 * garden-console/xray-mode.ts
 * xray() and explore() — surface visualization modes
 */

import type { Surface } from './types';
import { TYPE_COLORS, styles } from './surfaces';

/** State for xray mode */
export interface XrayState {
  active: boolean;
  elements: HTMLElement[];
  overlayData: Array<{ overlay: HTMLElement; element: Element }>;
  resizeHandler: (() => void) | null;
  keyHandler: ((e: KeyboardEvent) => void) | null;
}

/** State for explore mode */
export interface ExploreState {
  active: boolean;
  index: number;
}

/** Create initial xray state */
export function createXrayState(): XrayState {
  return {
    active: false,
    elements: [],
    overlayData: [],
    resizeHandler: null,
    keyHandler: null,
  };
}

/** Create initial explore state */
export function createExploreState(): ExploreState {
  return {
    active: false,
    index: 0,
  };
}

/**
 * Create xray mode function with closure over state
 */
export function createXrayMode(
  state: XrayState,
  surfaces: Surface[]
): (enabled?: boolean) => void {

  function repositionOverlays(): void {
    state.overlayData.forEach(({ overlay, element }) => {
      const rect = element.getBoundingClientRect();
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    });
  }

  return function xray(enabled?: boolean): void {
    const shouldEnable = enabled !== undefined ? enabled : !state.active;

    // Clean up existing overlays and listeners
    state.elements.forEach(el => el.remove());
    state.elements = [];
    state.overlayData = [];
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
      state.resizeHandler = null;
    }
    if (state.keyHandler) {
      document.removeEventListener('keydown', state.keyHandler);
      state.keyHandler = null;
    }

    if (!shouldEnable) {
      state.active = false;
      console.log('%c🌿 xray: off', styles.header);
      return;
    }

    state.active = true;
    console.log('%c🌿 xray: active', styles.header);
    console.log('%ccolor key:', styles.muted);
    console.log('%c  ■ interactive', 'color: #2d5a3d;');
    console.log('%c  ■ stateful', 'color: #c08820;');
    console.log('%c  ■ potential', 'color: #c93f7a;');
    console.log('%c  ■ structural', 'color: #8a7350;');

    surfaces.forEach(surface => {
      const elements = document.querySelectorAll(surface.selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const color = TYPE_COLORS[surface.type];

        const overlay = document.createElement('div');
        overlay.className = 'garden-xray-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: ${rect.top + window.scrollY}px;
          left: ${rect.left + window.scrollX}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          border: 2px dashed ${color};
          background: ${color}10;
          pointer-events: none;
          z-index: 9998;
          box-sizing: border-box;
        `;

        const label = document.createElement('span');
        label.style.cssText = `
          position: absolute;
          top: -18px;
          left: 0;
          font-size: 10px;
          font-family: monospace;
          color: ${color};
          background: var(--parchment, #f4efe6);
          padding: 1px 4px;
          white-space: nowrap;
        `;
        label.textContent = surface.name;
        overlay.appendChild(label);

        document.body.appendChild(overlay);
        state.elements.push(overlay);
        state.overlayData.push({ overlay, element: el });
      });
    });

    // Reposition on resize (handles devtools open/close)
    state.resizeHandler = repositionOverlays;
    window.addEventListener('resize', state.resizeHandler);

    // Escape key dismisses xray (works without devtools)
    // Use a reference to xray through closure
    const xrayFn = xray;
    state.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.active) {
        xrayFn(false);
      }
    };
    document.addEventListener('keydown', state.keyHandler);

    console.log('%c\nesc or garden.xray(false) to turn off', styles.muted);
  };
}

/**
 * Create explore mode function with closure over state
 */
export function createExploreMode(
  state: ExploreState,
  surfaces: Surface[]
): () => void {

  return function explore(): void {
    if (state.active) {
      console.log('%calready in explore mode. q to quit.', styles.body);
      return;
    }

    state.active = true;
    state.index = 0;

    console.log('%c🌿 surface diagnostic mode', styles.header);
    console.log('%cn/→ = next · p/← = prev · q/esc = quit', styles.muted);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let highlightEl: HTMLElement | null = null;

    function showSurface(index: number): void {
      // Clean up previous highlight
      if (highlightEl) {
        highlightEl.remove();
        highlightEl = null;
      }

      const surface = surfaces[index];
      const elements = document.querySelectorAll(surface.selector);
      const count = elements.length;

      console.clear();
      console.log('%c🌿 surface diagnostic mode', styles.header);
      console.log('%c[' + (index + 1) + '/' + surfaces.length + '] ' + surface.name, 'color: #2d5a3d; font-size: 13px; font-weight: bold;');
      console.log('%cselector: %c' + surface.selector, styles.label, styles.body);
      console.log('%ctype: %c' + surface.type, styles.label, styles.body);
      console.log('%cfound: %c' + count + ' element' + (count !== 1 ? 's' : ''), styles.label, styles.body);
      console.log('%c\n' + surface.description, styles.body);
      console.log('%c\nn/→ = next · p/← = prev · q/esc = quit', styles.muted);

      if (count > 0) {
        const target = elements[0];
        const rect = target.getBoundingClientRect();
        const color = TYPE_COLORS[surface.type];

        // Scroll into view
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
        });

        // Create highlight
        highlightEl = document.createElement('div');
        highlightEl.className = 'garden-explore-highlight';
        highlightEl.style.cssText = `
          position: absolute;
          top: ${rect.top + window.scrollY - 4}px;
          left: ${rect.left + window.scrollX - 4}px;
          width: ${rect.width + 8}px;
          height: ${rect.height + 8}px;
          border: 3px solid ${color};
          background: ${color}15;
          pointer-events: none;
          z-index: 9999;
          box-sizing: border-box;
          border-radius: 4px;
          transition: all 0.2s ease;
        `;
        document.body.appendChild(highlightEl);
      }
    }

    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'n' || e.key === 'ArrowRight') {
        state.index = (state.index + 1) % surfaces.length;
        showSurface(state.index);
      } else if (e.key === 'p' || e.key === 'ArrowLeft') {
        state.index = (state.index - 1 + surfaces.length) % surfaces.length;
        showSurface(state.index);
      } else if (e.key === 'q' || e.key === 'Escape') {
        cleanup();
      }
    }

    function cleanup(): void {
      state.active = false;
      document.removeEventListener('keydown', handleKey);
      if (highlightEl) {
        highlightEl.remove();
        highlightEl = null;
      }
      console.clear();
      console.log('%c🌿 diagnostic mode ended', styles.header);
      console.log('%cthe surfaces remember.', styles.muted);
    }

    document.addEventListener('keydown', handleKey);
    showSurface(state.index);
  };
}
