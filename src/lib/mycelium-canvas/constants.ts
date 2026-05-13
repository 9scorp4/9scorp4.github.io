/**
 * Constants for MyceliumCanvas rendering.
 */

import type { CitationType } from './types';

/** Colors from tokens.css */
export const COLORS = {
  paper: '#efe2c2',
  paperLine: '#c9b886',
  fern: '#2d5a3d',
  ochre: '#b8860b',
  ochreMuted: '#9a7209',
  sun: '#c93f7a',
  ink: '#3d2f1a',
  inkSoft: '#6b5435',
  inkFaint: '#8a7350',
} as const;

/** Dash patterns for citation types */
export const CITATION_DASH_PATTERNS: Record<CitationType, number[]> = {
  section: [],           // solid
  text: [4, 4],          // short dash
  block: [8, 4],         // long dash
  heading: [2, 4, 6, 4], // dot-dash
};

/** Zoom constraints and settings */
export const ZOOM = {
  min: 0.3,
  max: 3,
  sensitivity: 0.002,
  weightLabelThreshold: 1.5,
} as const;
