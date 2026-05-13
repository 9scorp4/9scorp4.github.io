/**
 * Core analytics infrastructure
 *
 * Contains the base query function and domain categorization constants
 * used across all analytics modules.
 */

import type { AnalyticsResponse } from './analytics-types.ts';

// Domain categorization constants
export const SEARCH_DOMAINS = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex'];
export const SOCIAL_DOMAINS = [
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
