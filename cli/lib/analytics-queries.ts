/**
 * Analytics query functions
 *
 * Each function executes a SQL query against Cloudflare Analytics Engine
 * and returns typed data ready for display.
 */

import type {
  AnalyticsResponse,
  AnalyticsRow,
  UniqueVisitorsData,
  PageViewData,
  CommandUsageData,
  ArticleEngagementData,
  CountryData,
  SubmissionData,
  ReferrerBreakdownData,
  DeviceData,
  TimeOfDayData,
  NodeClickData,
  SpecimenOpenData,
  OutboundClickData,
  DevTrafficData,
} from './analytics-types.ts';

// Domain categorization constants
const SEARCH_DOMAINS = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex'];
const SOCIAL_DOMAINS = [
  'twitter', 'x.com', 'facebook', 'instagram', 'linkedin',
  'reddit', 'mastodon', 'threads', 'tiktok', 'youtube'
];

/**
 * Execute SQL query against Cloudflare Analytics Engine
 */
export async function queryAnalytics(sql: string): Promise<AnalyticsResponse> {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CF_ACCOUNT_ID;

  if (!cfApiToken || !cfAccountId) {
    throw new Error('CF_API_TOKEN and CF_ACCOUNT_ID required for stats');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analytics API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<AnalyticsResponse>;
}

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

export async function getTopPages(days: number): Promise<PageViewData[]> {
  const pages = await queryAnalytics(`
    SELECT blob2 as path, count() as views
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2
    ORDER BY views DESC
    LIMIT 10
  `);

  return pages.data.map(row => ({
    path: String(row.path),
    views: Number(row.views),
  }));
}

export async function getCommandUsage(days: number): Promise<CommandUsageData[]> {
  const commands = await queryAnalytics(`
    SELECT blob2 as command, count() as uses, blob5 as is_secret
    FROM garden_metrics
    WHERE blob1 = 'command'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2, blob5
    ORDER BY uses DESC
    LIMIT 10
  `);

  return commands.data.map(row => ({
    command: String(row.command),
    uses: Number(row.uses),
    isSecret: row.is_secret === 'secret',
  }));
}

export async function getArticleEngagement(days: number): Promise<ArticleEngagementData[]> {
  const articles = await queryAnalytics(`
    SELECT
      blob2 as path,
      count() as reads,
      avg(double1) as avg_read_time,
      avg(double2) as avg_scroll_depth
    FROM garden_metrics
    WHERE blob1 = 'article_read'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2
    ORDER BY reads DESC
    LIMIT 10
  `);

  return articles.data.map(row => ({
    path: String(row.path),
    reads: Number(row.reads),
    avgTime: Math.round(Number(row.avg_read_time) || 0),
    avgScrollDepth: Math.round(Number(row.avg_scroll_depth) || 0),
  }));
}

export async function getCountryDistribution(days: number): Promise<CountryData[]> {
  const countries = await queryAnalytics(`
    SELECT blob3 as country, count() as events
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
      AND blob3 != ''
    GROUP BY blob3
    ORDER BY events DESC
    LIMIT 10
  `);

  return countries.data.map(row => ({
    country: String(row.country),
    events: Number(row.events),
  }));
}

export async function getSubmissions(days: number): Promise<SubmissionData[]> {
  const submissions = await queryAnalytics(`
    SELECT blob2 as status, count() as total
    FROM garden_metrics
    WHERE blob1 = 'submission'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob2
  `);

  return submissions.data.map(row => ({
    status: String(row.status),
    total: Number(row.total),
  }));
}

export async function getReferrerBreakdown(days: number): Promise<ReferrerBreakdownData> {
  const referrers = await queryAnalytics(`
    SELECT blob4 as referrer, count() as visits
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY blob4
    ORDER BY visits DESC
  `);

  const categories = { direct: 0, search: 0, social: 0, other: 0 };

  for (const row of referrers.data) {
    const ref = String(row.referrer || '').toLowerCase();
    const visits = Number(row.visits);

    if (!ref) {
      categories.direct += visits;
    } else if (SEARCH_DOMAINS.some(d => ref.includes(d))) {
      categories.search += visits;
    } else if (SOCIAL_DOMAINS.some(d => ref.includes(d))) {
      categories.social += visits;
    } else {
      categories.other += visits;
    }
  }

  return categories;
}

export async function getDeviceBreakdown(days: number): Promise<DeviceData[]> {
  const devices = await queryAnalytics(`
    SELECT blob5 as device_type, count() as visits
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
      AND blob5 != ''
    GROUP BY blob5
    ORDER BY visits DESC
  `);

  return devices.data.map(row => ({
    deviceType: String(row.device_type),
    visits: Number(row.visits),
  }));
}

export async function getTimeOfDay(days: number): Promise<TimeOfDayData | null> {
  const hours = await queryAnalytics(`
    SELECT double3, count() as visits
    FROM garden_metrics
    WHERE blob1 = 'pageview'
      AND blob7 != 'dev'
      AND timestamp > NOW() - INTERVAL '${days}' DAY
      AND double3 >= 0
      AND double3 < 24
    GROUP BY double3
  `);

  if (hours.data.length === 0) {
    return null;
  }

  let morning = 0, afternoon = 0, evening = 0, night = 0;
  for (const row of hours.data) {
    const h = Math.round(Number(row.double3));
    const v = Number(row.visits);
    if (h >= 6 && h < 12) morning += v;
    else if (h >= 12 && h < 18) afternoon += v;
    else if (h >= 18 && h < 23) evening += v;
    else night += v;
  }

  return { morning, afternoon, evening, night };
}

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

// Re-export domain constants for testing
export { SEARCH_DOMAINS, SOCIAL_DOMAINS };
