/**
 * Garden analytics command
 *
 * Queries Cloudflare Analytics Engine for garden metrics.
 */

import { title, print, muted, blank, error, divider } from '../lib/cli-style.ts';
import { parseDaysFlag } from '../lib/cli-utils.ts';

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsRow = Record<string, any>;

interface AnalyticsResponse {
  data: AnalyticsRow[];
  meta: {
    name: string;
    type: string;
  }[];
  rows: number;
}

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────

async function queryAnalytics(sql: string): Promise<AnalyticsResponse> {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    throw new Error('CF_API_TOKEN and CF_ACCOUNT_ID required for stats');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
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

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function run(args: string[]): Promise<void> {
  const days = parseDaysFlag(args, 7);

  title(`garden metrics (last ${days} days)`);

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    error('Stats requires CF_API_TOKEN and CF_ACCOUNT_ID in .env');
    print('Get these from Cloudflare dashboard → Analytics Engine');
    blank();
    return;
  }

  divider();

  // Unique visitors (excluding dev traffic)
  try {
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

    blank();
    print('Unique visitors:');
    if (uniques.data.length === 0 || !uniques.data[0].unique_visitors) {
      muted('  (no data yet - requires enhanced tracking)');
    } else {
      const uv = Number(uniques.data[0].unique_visitors);
      const total = Number(uniques.data[0].total_events);
      const pagesPerVisitor = uv > 0 ? (total / uv).toFixed(1) : '0';
      print(`  ${uv} unique · ${total} pageviews · ${pagesPerVisitor} pages/visitor`);

      // New vs returning (visitors with 1 vs >1 pageviews)
      const retention = await queryAnalytics(`
        SELECT blob6 as vid, count() as pageviews
        FROM garden_metrics
        WHERE blob1 = 'pageview'
          AND blob7 != 'dev'
          AND blob6 != ''
          AND timestamp > NOW() - INTERVAL '${days}' DAY
        GROUP BY blob6
      `);

      if (retention.data.length > 0) {
        const newVisitors = retention.data.filter(r => Number(r.pageviews) === 1).length;
        const returning = retention.data.filter(r => Number(r.pageviews) > 1).length;
        print(`  ${newVisitors} new · ${returning} returning`);
      }
    }
  } catch {
    blank();
    muted('Unique visitors: (query failed)');
  }

  // Top pages
  try {
    const pages = await queryAnalytics(`
      SELECT blob2 as path, count() as views
      FROM garden_metrics
      WHERE blob1 = 'pageview'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2
      ORDER BY views DESC
      LIMIT 10
    `);

    blank();
    print('Top pages:');
    if (pages.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of pages.data) {
        print(`  ${String(row.views).padStart(4)} │ ${row.path}`);
      }
    }
  } catch {
    blank();
    muted('Top pages: (query failed)');
  }

  // Command usage
  try {
    const commands = await queryAnalytics(`
      SELECT blob2 as command, count() as uses, blob5 as is_secret
      FROM garden_metrics
      WHERE blob1 = 'command'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2, blob5
      ORDER BY uses DESC
      LIMIT 10
    `);

    blank();
    print('Command usage:');
    if (commands.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of commands.data) {
        const secretMarker = row.is_secret === 'secret' ? ' *' : '';
        print(`  ${String(row.uses).padStart(4)} │ ${row.command}${secretMarker}`);
      }
    }
  } catch {
    blank();
    muted('Command usage: (query failed)');
  }

  // Article engagement
  try {
    const articles = await queryAnalytics(`
      SELECT
        blob2 as path,
        count() as reads,
        avg(double1) as avg_read_time,
        avg(double2) as avg_scroll_depth
      FROM garden_metrics
      WHERE blob1 = 'article_read'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2
      ORDER BY reads DESC
      LIMIT 10
    `);

    blank();
    print('Article engagement:');
    if (articles.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of articles.data) {
        const avgTime = Math.round(Number(row.avg_read_time) || 0);
        const avgDepth = Math.round(Number(row.avg_scroll_depth) || 0);
        print(`  ${String(row.reads).padStart(3)} reads │ ${avgTime}s avg │ ${avgDepth}% scroll │ ${row.path}`);
      }
    }
  } catch {
    blank();
    muted('Article engagement: (query failed)');
  }

  // Country distribution
  try {
    const countries = await queryAnalytics(`
      SELECT blob3 as country, count() as events
      FROM garden_metrics
      WHERE blob1 = 'pageview'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
        AND blob3 != ''
      GROUP BY blob3
      ORDER BY events DESC
      LIMIT 10
    `);

    blank();
    print('Country distribution:');
    if (countries.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of countries.data) {
        print(`  ${String(row.events).padStart(4)} │ ${row.country}`);
      }
    }
  } catch {
    blank();
    muted('Country distribution: (query failed)');
  }

  // Submissions
  try {
    const submissions = await queryAnalytics(`
      SELECT blob2 as status, count() as total
      FROM garden_metrics
      WHERE blob1 = 'submission'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2
    `);

    blank();
    print('Submissions:');
    if (submissions.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of submissions.data) {
        print(`  ${String(row.total).padStart(4)} │ ${row.status}`);
      }
    }
  } catch {
    blank();
    muted('Submissions: (query failed)');
  }

  // Referrer breakdown (fetch raw referrers and categorize client-side)
  try {
    const referrers = await queryAnalytics(`
      SELECT blob4 as referrer, count() as visits
      FROM garden_metrics
      WHERE blob1 = 'pageview'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob4
      ORDER BY visits DESC
    `);

    blank();
    print('Referrer breakdown:');
    if (referrers.data.length === 0) {
      muted('  (no data yet)');
    } else {
      // Categorize client-side
      const categories: Record<string, number> = { direct: 0, search: 0, social: 0, other: 0 };
      const searchDomains = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex'];
      const socialDomains = ['twitter', 'x.com', 'facebook', 'instagram', 'linkedin', 'reddit', 'mastodon', 'threads', 'tiktok', 'youtube'];

      for (const row of referrers.data) {
        const ref = String(row.referrer || '').toLowerCase();
        const visits = Number(row.visits);

        if (!ref) {
          categories.direct += visits;
        } else if (searchDomains.some(d => ref.includes(d))) {
          categories.search += visits;
        } else if (socialDomains.some(d => ref.includes(d))) {
          categories.social += visits;
        } else {
          categories.other += visits;
        }
      }

      // Sort by count descending
      const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
      for (const [category, visits] of sorted) {
        if (visits > 0) {
          print(`  ${String(visits).padStart(4)} │ ${category}`);
        }
      }
    }
  } catch {
    blank();
    muted('Referrer breakdown: (query failed)');
  }

  // Device breakdown
  try {
    const devices = await queryAnalytics(`
      SELECT blob5 as device_type, count() as visits
      FROM garden_metrics
      WHERE blob1 = 'pageview'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
        AND blob5 != ''
      GROUP BY blob5
      ORDER BY visits DESC
    `);

    blank();
    print('Device breakdown:');
    if (devices.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of devices.data) {
        print(`  ${String(row.visits).padStart(4)} │ ${row.device_type}`);
      }
    }
  } catch {
    blank();
    muted('Device breakdown: (query failed)');
  }

  // Time-of-day distribution (requires enhanced pageview data with double3)
  try {
    const hours = await queryAnalytics(`
      SELECT double3, count() as visits
      FROM garden_metrics
      WHERE blob1 = 'pageview'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
        AND double3 >= 0
        AND double3 < 24
      GROUP BY double3
    `);

    blank();
    print('Time-of-day (visitor local time):');
    if (hours.data.length === 0) {
      muted('  (no data yet - requires enhanced tracking)');
    } else {
      // Group into morning/afternoon/evening/night
      let morning = 0, afternoon = 0, evening = 0, night = 0;
      for (const row of hours.data) {
        const h = Math.round(Number(row.double3));
        const v = Number(row.visits);
        if (h >= 6 && h < 12) morning += v;
        else if (h >= 12 && h < 18) afternoon += v;
        else if (h >= 18 && h < 23) evening += v;
        else night += v;
      }
      print(`  ${String(morning).padStart(4)} │ morning (6-12)`);
      print(`  ${String(afternoon).padStart(4)} │ afternoon (12-18)`);
      print(`  ${String(evening).padStart(4)} │ evening (18-23)`);
      print(`  ${String(night).padStart(4)} │ night (23-6)`);
    }
  } catch {
    blank();
    muted('Time-of-day: (query failed)');
  }

  // Node clicks (mycelium interactions)
  try {
    const nodeClicks = await queryAnalytics(`
      SELECT blob2 as node_type, blob5 as node_label, count() as clicks
      FROM garden_metrics
      WHERE blob1 = 'node_click'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2, blob5
      ORDER BY clicks DESC
      LIMIT 10
    `);

    blank();
    print('Mycelium node clicks:');
    if (nodeClicks.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of nodeClicks.data) {
        const label = String(row.node_label).slice(0, 40);
        print(`  ${String(row.clicks).padStart(3)} │ ${row.node_type} │ ${label}`);
      }
    }
  } catch {
    blank();
    muted('Mycelium node clicks: (query failed)');
  }

  // Specimen opens
  try {
    const specimens = await queryAnalytics(`
      SELECT blob2 as specimen_name, blob4 as series, count() as opens
      FROM garden_metrics
      WHERE blob1 = 'specimen_open'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2, blob4
      ORDER BY opens DESC
      LIMIT 10
    `);

    blank();
    print('Specimen opens:');
    if (specimens.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of specimens.data) {
        const series = row.series ? ` (${row.series})` : '';
        print(`  ${String(row.opens).padStart(3)} │ ${row.specimen_name}${series}`);
      }
    }
  } catch {
    blank();
    muted('Specimen opens: (query failed)');
  }

  // Outbound clicks
  try {
    const outbound = await queryAnalytics(`
      SELECT blob2 as domain, count() as clicks
      FROM garden_metrics
      WHERE blob1 = 'outbound_click'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2
      ORDER BY clicks DESC
      LIMIT 10
    `);

    blank();
    print('Outbound clicks:');
    if (outbound.data.length === 0) {
      muted('  (no data yet)');
    } else {
      for (const row of outbound.data) {
        print(`  ${String(row.clicks).padStart(4)} │ ${row.domain}`);
      }
    }
  } catch {
    blank();
    muted('Outbound clicks: (query failed)');
  }

  // Developer traffic by device (your own visits)
  try {
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

    blank();
    print('Dev traffic (your devices):');
    if (devTraffic.data.length === 0) {
      muted('  (no dev traffic yet)');
    } else {
      // Group by device
      const byDevice: Record<string, AnalyticsRow[]> = {};
      for (const row of devTraffic.data) {
        const device = String(row.device || 'unnamed');
        if (!byDevice[device]) byDevice[device] = [];
        byDevice[device].push(row);
      }

      for (const [device, rows] of Object.entries(byDevice)) {
        const totalEvents = rows.reduce((sum, r) => sum + Number(r.events), 0);
        print(`  ${device} (${totalEvents} events)`);
        // Show top 3 paths for this device
        const pathCounts: Record<string, number> = {};
        for (const r of rows) {
          const key = `${r.event_type}: ${r.path}`;
          pathCounts[key] = (pathCounts[key] || 0) + Number(r.events);
        }
        const topPaths = Object.entries(pathCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        for (const [path, count] of topPaths) {
          muted(`    ${String(count).padStart(3)} │ ${path}`);
        }
      }

      // Total excluded
      const totalDev = devTraffic.data.reduce((sum, r) => sum + Number(r.events), 0);
      muted(`\n  (${totalDev} total dev events excluded from unique counts)`);
    }
  } catch {
    blank();
    muted('Dev traffic: (query failed)');
  }

  blank();
  divider();
  blank();
}
