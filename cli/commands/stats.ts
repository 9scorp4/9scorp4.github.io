/**
 * Garden analytics command
 *
 * Queries Cloudflare Analytics Engine for garden metrics.
 */

import { title, print, muted, blank, error, divider } from '../lib/cli-style.ts';
import { parseDaysFlag } from '../lib/cli-utils.ts';
import {
  getUniqueVisitors,
  getTopPages,
  getCommandUsage,
  getArticleEngagement,
  getCountryDistribution,
  getSubmissions,
  getReferrerBreakdown,
  getDeviceBreakdown,
  getTimeOfDay,
  getNodeClicks,
  getSpecimenOpens,
  getOutboundClicks,
  getDevTraffic,
} from '../lib/analytics-queries.ts';
import {
  displayUniqueVisitors,
  displayTopPages,
  displayCommandUsage,
  displayArticleEngagement,
  displayCountryDistribution,
  displaySubmissions,
  displayReferrerBreakdown,
  displayDeviceBreakdown,
  displayTimeOfDay,
  displayNodeClicks,
  displaySpecimenOpens,
  displayOutboundClicks,
  displayDevTraffic,
} from '../lib/analytics-formatters.ts';

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

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

  try {
    displayUniqueVisitors(await getUniqueVisitors(days));
  } catch {
    blank();
    muted('Unique visitors: (query failed)');
  }

  try {
    displayTopPages(await getTopPages(days));
  } catch {
    blank();
    muted('Top pages: (query failed)');
  }

  try {
    displayCommandUsage(await getCommandUsage(days));
  } catch {
    blank();
    muted('Command usage: (query failed)');
  }

  try {
    displayArticleEngagement(await getArticleEngagement(days));
  } catch {
    blank();
    muted('Article engagement: (query failed)');
  }

  try {
    displayCountryDistribution(await getCountryDistribution(days));
  } catch {
    blank();
    muted('Country distribution: (query failed)');
  }

  try {
    displaySubmissions(await getSubmissions(days));
  } catch {
    blank();
    muted('Submissions: (query failed)');
  }

  try {
    displayReferrerBreakdown(await getReferrerBreakdown(days));
  } catch {
    blank();
    muted('Referrer breakdown: (query failed)');
  }

  try {
    displayDeviceBreakdown(await getDeviceBreakdown(days));
  } catch {
    blank();
    muted('Device breakdown: (query failed)');
  }

  try {
    displayTimeOfDay(await getTimeOfDay(days));
  } catch {
    blank();
    muted('Time-of-day: (query failed)');
  }

  try {
    displayNodeClicks(await getNodeClicks(days));
  } catch {
    blank();
    muted('Mycelium node clicks: (query failed)');
  }

  try {
    displaySpecimenOpens(await getSpecimenOpens(days));
  } catch {
    blank();
    muted('Specimen opens: (query failed)');
  }

  try {
    displayOutboundClicks(await getOutboundClicks(days));
  } catch {
    blank();
    muted('Outbound clicks: (query failed)');
  }

  try {
    displayDevTraffic(await getDevTraffic(days));
  } catch {
    blank();
    muted('Dev traffic: (query failed)');
  }

  blank();
  divider();
  blank();
}
