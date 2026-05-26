/**
 * Citation edge building functions (wikilinks between articles/cultivations).
 */

import type {
  MyceliumNode,
  ArticleData,
  CultivationData,
  ExternalArticleData,
  EdgeData,
} from '../types.ts';
import { createExternalArticleId } from '../external-articles.ts';
import { citationPriority } from './constants.ts';

/**
 * Build article↔article edges (wikilinks)
 */
export function buildArticleWikilinkEdges(
  articles: ArticleData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
  for (const article of articles) {
    const sourceId = `a:${article.slug}`;
    for (const wikilink of article.wikilinks) {
      let targetId: string | null = null;

      if (wikilink.target.startsWith('journal:')) {
        const slug = wikilink.target.replace('journal:', '');
        targetId = `a:${slug}`;
      } else if (wikilink.target.startsWith('specimen:')) {
        const id = wikilink.target.replace('specimen:', '');
        targetId = `s:${id}`;
      }

      if (targetId && nodeMap.has(targetId)) {
        const edgeKey = [sourceId, targetId].sort().join('|');
        const existing = edgeMap.get(edgeKey);
        if (existing) {
          existing.weight = Math.max(existing.weight, 1.0);
          existing.reasons.add('cites');
          existing.citationCount = (existing.citationCount || 1) + 1;
          // Keep most specific citation type
          if (existing.citationType && citationPriority[wikilink.citationType] > citationPriority[existing.citationType]) {
            existing.citationType = wikilink.citationType;
          }
        } else {
          edgeMap.set(edgeKey, {
            weight: 1.0,
            reasons: new Set(['cites']),
            edgeType: 'wikilink',
            citationType: wikilink.citationType,
            citationCount: 1,
          });
        }
      }
    }
  }
}

/**
 * Build cultivation↔article edges (wikilinks)
 */
export function buildCultivationWikilinkEdges(
  cultivations: CultivationData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
  for (const cult of cultivations) {
    const sourceId = `c:${cult.slug}`;
    for (const wikilink of cult.wikilinks) {
      if (wikilink.target.startsWith('journal:')) {
        const slug = wikilink.target.replace('journal:', '');
        const targetId = `a:${slug}`;
        if (nodeMap.has(targetId)) {
          const edgeKey = [sourceId, targetId].sort().join('|');
          const existing = edgeMap.get(edgeKey);
          if (existing) {
            existing.citationCount = (existing.citationCount || 1) + 1;
            if (existing.citationType && citationPriority[wikilink.citationType] > citationPriority[existing.citationType]) {
              existing.citationType = wikilink.citationType;
            }
          } else {
            edgeMap.set(edgeKey, {
              weight: 0.8,
              reasons: new Set(['references']),
              edgeType: 'wikilink',
              citationType: wikilink.citationType,
              citationCount: 1,
            });
          }
        }
      }
    }
  }
}

/**
 * Build article→externalArticle edges (citations)
 */
export function buildExternalArticleCitationEdges(
  externalArticles: ExternalArticleData[],
  nodeMap: Map<string, MyceliumNode>,
  edgeMap: Map<string, EdgeData>
): void {
  for (const ext of externalArticles) {
    const sourceId = `a:${ext.sourceSlug}`;
    const targetId = createExternalArticleId(ext.url);

    if (!nodeMap.has(sourceId) || !nodeMap.has(targetId)) continue;

    const edgeKey = [sourceId, targetId].sort().join('|');
    const existing = edgeMap.get(edgeKey);

    if (existing) {
      existing.citationCount = (existing.citationCount || 1) + 1;
    } else {
      edgeMap.set(edgeKey, {
        weight: 0.8,
        reasons: new Set(['cites external']),
        edgeType: 'citation',
        citationCount: 1,
      });
    }
  }
}
