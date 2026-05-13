/**
 * Engagement metrics queries
 *
 * Command usage, article reads, and visitor submissions.
 */

import type {
  CommandUsageData,
  ArticleEngagementData,
  SubmissionData,
} from './analytics-types.ts';
import { queryAnalytics } from './analytics-base.ts';

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
