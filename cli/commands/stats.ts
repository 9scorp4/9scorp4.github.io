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

  blank();
  divider();
  blank();
}
