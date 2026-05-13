/**
 * Visitor metrics queries
 *
 * Unique visitors, session data, and retention metrics.
 */

import type { UniqueVisitorsData } from './analytics-types.ts';
import { queryAnalytics } from './analytics-base.ts';

export async function getUniqueVisitors(days: number): Promise<UniqueVisitorsData | null> {
  const uniques = await queryAnalytics(`
    SELECT
      count(DISTINCT blob6) as unique_visitors,
      count() as total_events
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND blob6 != ''
      AND timestamp > NOW() - INTERVAL '${days}' DAY
  `);

  if (uniques.data.length === 0 || !uniques.data[0].unique_visitors) {
    return null;
  }

  const totalVisitors = Number(uniques.data[0].unique_visitors);
  const totalEvents = Number(uniques.data[0].total_events);
  const pagesPerVisitor = totalVisitors > 0 ? (totalEvents / totalVisitors).toFixed(1) : '0';

  // Get new vs returning
  const retention = await queryAnalytics(`
    SELECT blob6 as vid, count() as pageviews
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND blob6 != ''
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob6
  `);

  const newVisitors = retention.data.filter(r => Number(r.pageviews) === 1).length;
  const returning = retention.data.filter(r => Number(r.pageviews) > 1).length;

  return { totalVisitors, totalEvents, pagesPerVisitor, newVisitors, returning };
}
