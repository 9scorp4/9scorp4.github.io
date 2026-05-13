/**
 * Interaction metrics queries
 *
 * Node clicks, specimen opens, outbound clicks, and dev traffic.
 */

import type {
  AnalyticsRow,
  NodeClickData,
  SpecimenOpenData,
  OutboundClickData,
  DevTrafficData,
} from './analytics-types.ts';
import { queryAnalytics } from './analytics-base.ts';

export async function getNodeClicks(days: number): Promise<NodeClickData[]> {
  const nodeClicks = await queryAnalytics(`
    SELECT blob2 as node_type, blob5 as node_label, count() as clicks
    FROM garden_metrics
    WHERE blob1 = 'node_click'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2, blob5
    ORDER BY clicks DESC
    LIMIT 10
  `);

  return nodeClicks.data.map(row => ({
    nodeType: String(row.node_type),
    nodeLabel: String(row.node_label),
    clicks: Number(row.clicks),
  }));
}

export async function getSpecimenOpens(days: number): Promise<SpecimenOpenData[]> {
  const specimens = await queryAnalytics(`
    SELECT blob2 as specimen_name, blob4 as series, count() as opens
    FROM garden_metrics
    WHERE blob1 = 'specimen_open'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2, blob4
    ORDER BY opens DESC
    LIMIT 10
  `);

  return specimens.data.map(row => ({
    specimenName: String(row.specimen_name),
    series: row.series ? String(row.series) : null,
    opens: Number(row.opens),
  }));
}

export async function getOutboundClicks(days: number): Promise<OutboundClickData[]> {
  const outbound = await queryAnalytics(`
    SELECT blob2 as domain, count() as clicks
    FROM garden_metrics
    WHERE blob1 = 'outbound_click'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2
    ORDER BY clicks DESC
    LIMIT 10
  `);

  return outbound.data.map(row => ({
    domain: String(row.domain),
    clicks: Number(row.clicks),
  }));
}

export async function getDevTraffic(days: number): Promise<DevTrafficData> {
  const devTraffic = await queryAnalytics(`
    SELECT
      blob8 as device,
      blob2 as path,
      blob1 as event_type,
      count() as events,
      max(timestamp) as last_seen
    FROM garden_metrics
    WHERE blob7 = 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob8, blob2, blob1
    ORDER BY last_seen DESC
    LIMIT 30
  `);

  if (devTraffic.data.length === 0) {
    return { devices: [], totalDevEvents: 0 };
  }

  // Group by device
  const byDevice: Record<string, AnalyticsRow[]> = {};
  for (const row of devTraffic.data) {
    const device = String(row.device || 'unnamed');
    if (!byDevice[device]) byDevice[device] = [];
    byDevice[device].push(row);
  }

  const devices = Object.entries(byDevice).map(([device, rows]) => {
    const totalEvents = rows.reduce((sum, r) => sum + Number(r.events), 0);

    // Aggregate paths
    const pathCounts: Record<string, number> = {};
    for (const r of rows) {
      const key = `${r.event_type}: ${r.path}`;
      pathCounts[key] = (pathCounts[key] || 0) + Number(r.events);
    }

    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path, count]) => ({ path, count }));

    return { device, totalEvents, topPaths };
  });

  const totalDevEvents = devTraffic.data.reduce((sum, r) => sum + Number(r.events), 0);

  return { devices, totalDevEvents };
}
