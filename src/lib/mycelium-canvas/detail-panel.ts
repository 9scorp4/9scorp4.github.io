/**
 * Detail panel rendering for MyceliumCanvas.
 */

import type { SimNode, SimLink } from './types';

/** Get status symbol for cultivation */
export function getStatusSymbol(status?: string): string {
  switch (status) {
    case 'growing': return '\u25b2';  // triangle up
    case 'dormant': return '\u25d0';  // circle half
    case 'wild': return '\u25cb';     // circle outline
    case 'composted': return '\u2715'; // x mark
    default: return '';
  }
}

/** Render track detail panel HTML */
function renderTrackDetail(node: SimNode): string {
  const hasBpm = node.bpm !== undefined;
  const hasKey = node.key !== undefined;
  const hasOpenKey = node.openKey !== undefined;
  const hasDanceability = node.danceability !== undefined;
  const hasEnriched = hasBpm || hasKey || hasOpenKey || hasDanceability;

  let html = `
    <p class="detail-title"><a href="${node.url}" target="_blank" rel="noopener">${node.artist} \u2014 ${node.title}</a></p>
    <p class="detail-meta">first heard: ${node.firstSeen}</p>
  `;

  if (hasEnriched) {
    const parts: string[] = [];
    if (hasBpm) parts.push(`${node.bpm} bpm`);
    if (hasKey) parts.push(hasOpenKey ? `${node.key} (${node.openKey})` : node.key!);
    if (hasDanceability) parts.push(`dance: ${node.danceability}`);
    if (node.timeSignature && node.timeSignature !== '4/4') parts.push(node.timeSignature);
    html += `<p class="detail-meta">${parts.join(' \u00b7 ')}</p>`;
  }

  if (node.songbpmId) {
    html += `<p class="detail-attribution">via <a href="https://getsongbpm.com/song/${node.songbpmId}" target="_blank" rel="noopener">getsongbpm.com</a>`;
    if (node.sourceVerified) html += ` \u00b7 verified`;
    html += `</p>`;
    if (node.corrections) {
      html += `<p class="detail-attribution">corrections: ${node.corrections}</p>`;
    }
  } else if (hasEnriched) {
    html += `<p class="detail-attribution">metadata harvested manually</p>`;
  }

  return html;
}

/** Render article detail panel HTML */
function renderArticleDetail(node: SimNode, links: SimLink[]): string {
  let html = `
    <p class="detail-title">${node.articleTitle || node.slug}</p>
    <p class="detail-meta">published: ${node.firstSeen}</p>
  `;

  const citedBy: string[] = [];
  const cites: string[] = [];
  for (const link of links) {
    if (link.edgeType !== 'wikilink') continue;
    const sourceNode = link.source;
    const targetNode = link.target;
    if (sourceNode.id === node.id && targetNode.type === 'article') {
      cites.push(targetNode.articleTitle || targetNode.slug || '');
    } else if (targetNode.id === node.id && sourceNode.type === 'article') {
      citedBy.push(sourceNode.articleTitle || sourceNode.slug || '');
    }
  }

  if (cites.length > 0) {
    html += `<p class="detail-meta">cites: ${cites.join(', ')}</p>`;
  }
  if (citedBy.length > 0) {
    html += `<p class="detail-meta">cited by: ${citedBy.join(', ')}</p>`;
  }

  html += `<p class="detail-action"><a href="/cuaderno/${node.slug}/">\u2192 read article</a></p>`;
  return html;
}

/** Render cultivation detail panel HTML */
function renderCultivationDetail(node: SimNode, links: SimLink[]): string {
  const symbol = getStatusSymbol(node.status);
  let html = `
    <p class="detail-title">${node.cultivationName || node.slug}</p>
    <p class="detail-meta">${symbol} ${node.status}</p>
  `;

  const connectedArticles: string[] = [];
  for (const link of links) {
    if (link.edgeType !== 'wikilink') continue;
    const sourceNode = link.source;
    const targetNode = link.target;
    if (sourceNode.id === node.id && targetNode.type === 'article') {
      connectedArticles.push(targetNode.articleTitle || targetNode.slug || '');
    } else if (targetNode.id === node.id && sourceNode.type === 'article') {
      connectedArticles.push(sourceNode.articleTitle || sourceNode.slug || '');
    }
  }

  if (connectedArticles.length > 0) {
    html += `<p class="detail-meta">connects to: ${connectedArticles.join(', ')}</p>`;
  }

  html += `<p class="detail-action"><a href="/#cultivations">\u2192 view cultivation</a></p>`;
  return html;
}

/** Render dispatch detail panel HTML */
function renderDispatchDetail(node: SimNode, links: SimLink[]): string {
  const date = new Date(node.date + 'T00:00:00');
  const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  let html = `<p class="detail-title">${formatted}</p>`;

  const parts: string[] = [];
  if (node.announcements && node.announcements > 0) {
    parts.push(`${node.announcements} announcement${node.announcements > 1 ? 's' : ''}`);
  }
  if (node.hasProseLinks) {
    parts.push('prose links');
  }
  if (parts.length > 0) {
    html += `<p class="detail-meta">${parts.join(' \u00b7 ')}</p>`;
  }

  let trackCount = 0;
  let articleCount = 0;
  for (const link of links) {
    const sourceNode = link.source;
    const targetNode = link.target;
    const otherNode = sourceNode.id === node.id ? targetNode : (targetNode.id === node.id ? sourceNode : null);
    if (otherNode) {
      if (otherNode.type === 'track') trackCount++;
      if (otherNode.type === 'article') articleCount++;
    }
  }

  const connectionParts: string[] = [];
  if (trackCount > 0) connectionParts.push(`${trackCount} track${trackCount > 1 ? 's' : ''}`);
  if (articleCount > 0) connectionParts.push(`${articleCount} article${articleCount > 1 ? 's' : ''}`);
  if (connectionParts.length > 0) {
    html += `<p class="detail-meta">connects: ${connectionParts.join(', ')}</p>`;
  }

  html += `<p class="detail-action"><a href="/ahora#${node.date}">\u2192 view dispatch</a></p>`;
  return html;
}

/** Render exit node detail panel HTML */
function renderExitDetail(node: SimNode, links: SimLink[]): string {
  let html = `
    <p class="detail-title"><a href="${node.url}" target="_blank" rel="noopener">${node.label}</a></p>
    <p class="detail-meta">external link</p>
  `;

  let linkCount = 0;
  for (const link of links) {
    const sourceNode = link.source;
    const targetNode = link.target;
    if ((sourceNode.id === node.id || targetNode.id === node.id) && link.edgeType === 'exit') {
      linkCount++;
    }
  }
  if (linkCount > 0) {
    html += `<p class="detail-meta">${linkCount} connection${linkCount > 1 ? 's' : ''}</p>`;
  }

  return html;
}

/** Render specimen detail panel HTML */
function renderSpecimenDetail(node: SimNode): string {
  const symbol = getStatusSymbol(node.specimenStatus);
  let html = `
    <p class="detail-title">${node.specimenName || node.slug}</p>
    <p class="detail-meta">${symbol} ${node.specimenStatus}</p>
  `;

  if (node.specimenSeries) {
    html += `<p class="detail-meta">series: ${node.specimenSeries}</p>`;
  }

  html += `<p class="detail-meta">grown: ${node.firstSeen}</p>`;
  html += `<p class="detail-action"><a href="/#${node.slug}">\u2192 view specimen</a></p>`;
  return html;
}

/** Render external article detail panel HTML */
function renderExternalArticleDetail(node: SimNode, links: SimLink[]): string {
  const title = node.externalTitle || node.externalDomain || 'external article';
  let html = `
    <p class="detail-title"><a href="${node.url}" target="_blank" rel="noopener">${title}</a></p>
    <p class="detail-meta">${node.externalDomain || 'external'}</p>
  `;

  if (node.externalAuthor) {
    html += `<p class="detail-meta">by ${node.externalAuthor}</p>`;
  }

  // Find citing articles
  const citedBy: string[] = [];
  for (const link of links) {
    if (link.edgeType !== 'citation') continue;
    const sourceNode = link.source;
    const targetNode = link.target;
    if (targetNode.id === node.id && sourceNode.type === 'article') {
      citedBy.push(sourceNode.articleTitle || sourceNode.slug || '');
    }
  }

  if (citedBy.length > 0) {
    html += `<p class="detail-meta">cited by: ${citedBy.join(', ')}</p>`;
  }

  if (node.appearances && node.appearances > 1) {
    html += `<p class="detail-meta">${node.appearances} citations</p>`;
  }

  return html;
}

/** Show detail panel for a node */
export function showDetail(panel: HTMLDivElement, node: SimNode, links: SimLink[]): void {
  let html = '';

  switch (node.type) {
    case 'track':
      html = renderTrackDetail(node);
      break;
    case 'article':
      html = renderArticleDetail(node, links);
      break;
    case 'cultivation':
      html = renderCultivationDetail(node, links);
      break;
    case 'specimen':
      html = renderSpecimenDetail(node);
      break;
    case 'dispatch':
      html = renderDispatchDetail(node, links);
      break;
    case 'exit':
      html = renderExitDetail(node, links);
      break;
    case 'externalArticle':
      html = renderExternalArticleDetail(node, links);
      break;
  }

  panel.innerHTML = html;
  panel.classList.add('visible');
}

/** Hide detail panel */
export function hideDetail(panel: HTMLDivElement): void {
  panel.classList.remove('visible');
}
