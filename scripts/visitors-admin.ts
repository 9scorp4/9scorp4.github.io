#!/usr/bin/env npx tsx
/**
 * Admin CLI for managing visitor messages and analytics
 *
 * Usage:
 *   npx tsx scripts/visitors-admin.ts list
 *   npx tsx scripts/visitors-admin.ts approve msg:01HXY...
 *   npx tsx scripts/visitors-admin.ts reject msg:01HXY...
 *   npx tsx scripts/visitors-admin.ts approve-all
 *   npx tsx scripts/visitors-admin.ts stats [--days=7]
 *
 * Environment:
 *   VISITORS_WORKER_URL - Worker URL (e.g., https://visitors.xxx.workers.dev)
 *   VISITORS_ADMIN_TOKEN - Admin bearer token
 *   CF_API_TOKEN - Cloudflare API token (for stats command)
 *   CF_ACCOUNT_ID - Cloudflare account ID (for stats command)
 */

import { config } from 'dotenv';
config();

interface VisitorMessage {
  id: string;
  nombre: string;
  mensaje: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

const WORKER_URL = process.env.PUBLIC_VISITORS_WORKER_URL;
const ADMIN_TOKEN = process.env.VISITORS_ADMIN_TOKEN;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

if (!WORKER_URL || !ADMIN_TOKEN) {
  console.error('Missing environment variables.');
  console.error('Set PUBLIC_VISITORS_WORKER_URL and VISITORS_ADMIN_TOKEN in .env');
  process.exit(1);
}

async function fetchApi(
  path: string,
  method: 'GET' | 'POST' = 'GET'
): Promise<unknown> {
  const response = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function listPending(): Promise<void> {
  const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

  if (data.messages.length === 0) {
    console.log('No pending messages.');
    return;
  }

  console.log(`\n${data.messages.length} pending message(s):\n`);
  for (const msg of data.messages) {
    console.log(`  ${msg.id}`);
    console.log(`  ${msg.nombre}: "${msg.mensaje}"`);
    console.log(`  ${msg.timestamp}`);
    console.log('');
  }
}

async function approveMessage(id: string): Promise<void> {
  const data = (await fetchApi(`/admin/approve/${id}`, 'POST')) as {
    ok: boolean;
    message: VisitorMessage;
  };

  if (data.ok) {
    console.log(`Approved: ${id}`);
    console.log(`  ${data.message.nombre}: "${data.message.mensaje}"`);
  }
}

async function rejectMessage(id: string): Promise<void> {
  const data = (await fetchApi(`/admin/reject/${id}`, 'POST')) as {
    ok: boolean;
    message: VisitorMessage;
  };

  if (data.ok) {
    console.log(`Rejected: ${id}`);
  }
}

async function approveAll(): Promise<void> {
  const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

  if (data.messages.length === 0) {
    console.log('No pending messages to approve.');
    return;
  }

  console.log(`Approving ${data.messages.length} message(s)...`);

  for (const msg of data.messages) {
    await approveMessage(msg.id);
  }

  console.log('\nAll messages approved.');
}

// Analytics Engine returns aliased column names from SQL
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

async function showStats(days: number): Promise<void> {
  if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    console.error('Stats requires CF_API_TOKEN and CF_ACCOUNT_ID in .env');
    console.error('Get these from Cloudflare dashboard → Analytics Engine');
    return;
  }

  console.log(`\nGarden metrics (last ${days} days)\n`);
  console.log('─'.repeat(50));

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

    console.log('\nTop pages:');
    if (pages.data.length === 0) {
      console.log('  (no data yet)');
    } else {
      for (const row of pages.data) {
        console.log(`  ${String(row.views).padStart(4)} │ ${row.path}`);
      }
    }
  } catch (err) {
    console.log('\nTop pages: (query failed)');
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

    console.log('\nCommand usage:');
    if (commands.data.length === 0) {
      console.log('  (no data yet)');
    } else {
      for (const row of commands.data) {
        const secretMarker = row.is_secret === 'secret' ? ' *' : '';
        console.log(`  ${String(row.uses).padStart(4)} │ ${row.command}${secretMarker}`);
      }
    }
  } catch (err) {
    console.log('\nCommand usage: (query failed)');
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

    console.log('\nArticle engagement:');
    if (articles.data.length === 0) {
      console.log('  (no data yet)');
    } else {
      for (const row of articles.data) {
        const avgTime = Math.round(Number(row.avg_read_time) || 0);
        const avgDepth = Math.round(Number(row.avg_scroll_depth) || 0);
        console.log(`  ${String(row.reads).padStart(3)} reads │ ${avgTime}s avg │ ${avgDepth}% scroll │ ${row.path}`);
      }
    }
  } catch (err) {
    console.log('\nArticle engagement: (query failed)');
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

    console.log('\nCountry distribution:');
    if (countries.data.length === 0) {
      console.log('  (no data yet)');
    } else {
      for (const row of countries.data) {
        console.log(`  ${String(row.events).padStart(4)} │ ${row.country}`);
      }
    }
  } catch (err) {
    console.log('\nCountry distribution: (query failed)');
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

    console.log('\nSubmissions:');
    if (submissions.data.length === 0) {
      console.log('  (no data yet)');
    } else {
      for (const row of submissions.data) {
        console.log(`  ${String(row.total).padStart(4)} │ ${row.status}`);
      }
    }
  } catch (err) {
    console.log('\nSubmissions: (query failed)');
  }

  console.log('\n' + '─'.repeat(50));
}

// CLI entry point
const [, , command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'list':
    case 'pending':
      await listPending();
      break;

    case 'approve':
      if (!args[0]) {
        console.error('Usage: approve <message-id>');
        process.exit(1);
      }
      await approveMessage(args[0]);
      break;

    case 'reject':
      if (!args[0]) {
        console.error('Usage: reject <message-id>');
        process.exit(1);
      }
      await rejectMessage(args[0]);
      break;

    case 'approve-all':
      await approveAll();
      break;

    case 'stats': {
      // Parse --days=N flag
      const daysArg = args.find(a => a.startsWith('--days='));
      const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 7;
      await showStats(isNaN(days) ? 7 : days);
      break;
    }

    default:
      console.log('Visitors Admin CLI');
      console.log('');
      console.log('Commands:');
      console.log('  list           List pending messages');
      console.log('  approve <id>   Approve a message');
      console.log('  reject <id>    Reject a message');
      console.log('  approve-all    Approve all pending messages');
      console.log('  stats          Show garden analytics (requires CF_API_TOKEN, CF_ACCOUNT_ID)');
      console.log('');
      console.log('Options:');
      console.log('  --days=N       Number of days for stats (default: 7)');
      break;
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
