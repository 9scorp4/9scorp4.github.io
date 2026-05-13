/**
 * Color palette and dimension constants for Instagram templates.
 */

// Extended palette for Instagram (matches src/styles/tokens.css)
export const colors = {
  paper: '#efe2c2',
  paperDeep: '#e8d9af',
  ink: '#3d2f1a',
  inkSoft: '#6b5435',
  inkFaint: '#8a7a5f',
  sun: '#c93f7a',
  fern: '#2d5a3d',
  ochre: '#c08820',
  terracotta: '#a8472a',
  paperLine: '#c9b886',
};

export type InstaFormat = 'square' | 'portrait';

export const INSTA_DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};
