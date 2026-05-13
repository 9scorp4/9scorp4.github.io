/**
 * garden-console/surfaces.ts
 * Surface definitions and utilities for the diagnostic API
 */

import type { Surface, PageContext } from './types';

// Surface definitions by page context
export const GARDEN_SURFACES: Surface[] = [
  // Interactive (respond to user input)
  { name: 'mandala', selector: '#mandala-canvas', type: 'interactive',
    description: 'p5 generative mandala. responds to time. potential: click interaction?' },
  { name: 'specimens', selector: '.specimen[data-clickable="true"]', type: 'interactive',
    description: 'clickable specimen tiles. opens modal with p5 sketch.' },
  { name: 'specimen-modal', selector: '#specimen-modal', type: 'interactive',
    description: 'full-size sketch viewer. keyboard-dismissable.' },
  { name: 'library-authors', selector: '.author-trigger[data-author]', type: 'interactive',
    description: 'accordion triggers for library entries.' },
  { name: 'console-input', selector: '#console-input', type: 'interactive',
    description: 'visitors book CLI. accepts commands.' },

  // Stateful (track visitor state)
  { name: 'mycelium', selector: 'a.mycelium-link', type: 'stateful',
    description: 'hidden portal to micelio. appears after conditions met.' },

  // Potential (surfaces for future features)
  { name: 'journal-entries', selector: '.journal-entry', type: 'potential',
    description: 'field journal teasers. potential: reading progress?' },
  { name: 'cultivations', selector: '.cultivation', type: 'potential',
    description: 'project cards. potential: status updates?' },
  { name: 'ahora-entries', selector: '.ahora-entry', type: 'potential',
    description: 'dispatch entries. potential: temporal markers?' },
  { name: 'footer', selector: '.site-footer', type: 'potential',
    description: 'trilingual sign-off. potential: secret commands?' },

  // Structural (anchors/containers)
  { name: 'header', selector: '.station-header', type: 'structural',
    description: 'garden entrance. navigation anchor.' },
  { name: 'section-now', selector: '#now', type: 'structural',
    description: 'ahora section anchor.' },
  { name: 'section-conservatory', selector: '#conservatory', type: 'structural',
    description: 'specimens section anchor.' },
  { name: 'section-journal', selector: '#journal', type: 'structural',
    description: 'field journal section anchor.' },
  { name: 'section-cultivations', selector: '#cultivations', type: 'structural',
    description: 'projects section anchor.' },
  { name: 'section-library', selector: '#library', type: 'structural',
    description: 'library section anchor.' },
  { name: 'section-visitors', selector: '#visitors', type: 'structural',
    description: 'visitors book section anchor.' },
];

export const ARTICLE_SURFACES: Surface[] = [
  // Diptych structure
  { name: 'diptych', selector: '.diptych', type: 'structural',
    description: 'diptych container. article + metalogue format.' },
  { name: 'article-body', selector: '#article, .article-body', type: 'interactive',
    description: 'article prose. tracks reading progress.' },
  { name: 'metalogue', selector: '#metalogue', type: 'interactive',
    description: 'metalogue section. dialogue format.' },
  { name: 'seam', selector: '.seam', type: 'potential',
    description: 'the fold between article and metalogue.' },
  { name: 'colophon', selector: '.diptych-colophon', type: 'potential',
    description: 'closing note. potential: easter egg?' },
  { name: 'return-marker', selector: '.return-marker', type: 'interactive',
    description: 'back to garden link.' },
  { name: 'diptych-nav', selector: '.diptych-nav', type: 'interactive',
    description: 'jump to article/metalogue.' },
  // Regular article fallback
  { name: 'article-page', selector: '.article-page', type: 'structural',
    description: 'simple article container.' },
];

export const MICELIO_SURFACES: Surface[] = [
  { name: 'mycelium-canvas', selector: '#mycelium-canvas', type: 'interactive',
    description: 'd3-force graph. drag nodes, click for details.' },
  { name: 'detail-panel', selector: '#mycelium-detail', type: 'interactive',
    description: 'song metadata panel. shows on node select.' },
  { name: 'micelio-header', selector: '.micelio-header', type: 'structural',
    description: 'trilingual title block.' },
  { name: 'micelio-footer', selector: '.micelio-footer', type: 'potential',
    description: 'attribution and return link.' },
];

export const TYPE_COLORS: Record<Surface['type'], string> = {
  interactive: '#2d5a3d', // --fern
  stateful: '#c08820',    // --ochre
  potential: '#c93f7a',   // --sun
  structural: '#8a7350',  // --ink-faint
};

export const styles = {
  header: 'color: #2d5a3d; font-size: 14px; font-weight: bold;',
  body: 'color: #8a7350; font-size: 12px;',
  muted: 'color: #666; font-size: 11px;',
  label: 'color: #2d5a3d; font-size: 11px; font-weight: bold;',
};

/**
 * Detect page context from pathname
 */
export function getPageContext(pathname: string): PageContext {
  if (pathname === '/' || pathname === '/index.html') return 'garden';
  if (pathname.startsWith('/cuaderno/')) return 'article';
  if (pathname.startsWith('/micelio')) return 'micelio';
  return 'unknown';
}

export function getSurfaces(context: PageContext): Surface[] {
  switch (context) {
    case 'garden': return GARDEN_SURFACES;
    case 'article': return ARTICLE_SURFACES;
    case 'micelio': return MICELIO_SURFACES;
    default: return [];
  }
}
