/**
 * Analytics display formatters
 *
 * Each function takes typed data and prints formatted output to console.
 */

import { print, muted, blank } from './cli-style.ts';
import type {
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

export function displayUniqueVisitors(data: UniqueVisitorsData | null): void {
  blank();
  print('Unique visitors:');
  if (!data) {
    muted('  (no data yet - requires enhanced tracking)');
    return;
  }

  print(`  ${data.totalVisitors} unique · ${data.totalEvents} pageviews · ${data.pagesPerVisitor} pages/visitor`);
  print(`  ${data.newVisitors} new · ${data.returning} returning`);
}

export function displayTopPages(data: PageViewData[]): void {
  blank();
  print('Top pages:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.views).padStart(4)} │ ${row.path}`);
  }
}

export function displayCommandUsage(data: CommandUsageData[]): void {
  blank();
  print('Command usage:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    const secretMarker = row.isSecret ? ' *' : '';
    print(`  ${String(row.uses).padStart(4)} │ ${row.command}${secretMarker}`);
  }
}

export function displayArticleEngagement(data: ArticleEngagementData[]): void {
  blank();
  print('Article engagement:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.reads).padStart(3)} reads │ ${row.avgTime}s avg │ ${row.avgScrollDepth}% scroll │ ${row.path}`);
  }
}

export function displayCountryDistribution(data: CountryData[]): void {
  blank();
  print('Country distribution:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.events).padStart(4)} │ ${row.country}`);
  }
}

export function displaySubmissions(data: SubmissionData[]): void {
  blank();
  print('Submissions:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.total).padStart(4)} │ ${row.status}`);
  }
}

export function displayReferrerBreakdown(data: ReferrerBreakdownData): void {
  blank();
  print('Referrer breakdown:');

  const hasData = data.direct > 0 || data.search > 0 || data.social > 0 || data.other > 0;
  if (!hasData) {
    muted('  (no data yet)');
    return;
  }

  // Sort by count descending
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  for (const [category, visits] of sorted) {
    if (visits > 0) {
      print(`  ${String(visits).padStart(4)} │ ${category}`);
    }
  }
}

export function displayDeviceBreakdown(data: DeviceData[]): void {
  blank();
  print('Device breakdown:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.visits).padStart(4)} │ ${row.deviceType}`);
  }
}

export function displayTimeOfDay(data: TimeOfDayData | null): void {
  blank();
  print('Time-of-day (visitor local time):');
  if (!data) {
    muted('  (no data yet - requires enhanced tracking)');
    return;
  }

  print(`  ${String(data.morning).padStart(4)} │ morning (6-12)`);
  print(`  ${String(data.afternoon).padStart(4)} │ afternoon (12-18)`);
  print(`  ${String(data.evening).padStart(4)} │ evening (18-23)`);
  print(`  ${String(data.night).padStart(4)} │ night (23-6)`);
}

export function displayNodeClicks(data: NodeClickData[]): void {
  blank();
  print('Mycelium node clicks:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    const label = row.nodeLabel.slice(0, 40);
    print(`  ${String(row.clicks).padStart(3)} │ ${row.nodeType} │ ${label}`);
  }
}

export function displaySpecimenOpens(data: SpecimenOpenData[]): void {
  blank();
  print('Specimen opens:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    const series = row.series ? ` (${row.series})` : '';
    print(`  ${String(row.opens).padStart(3)} │ ${row.specimenName}${series}`);
  }
}

export function displayOutboundClicks(data: OutboundClickData[]): void {
  blank();
  print('Outbound clicks:');
  if (data.length === 0) {
    muted('  (no data yet)');
    return;
  }

  for (const row of data) {
    print(`  ${String(row.clicks).padStart(4)} │ ${row.domain}`);
  }
}

export function displayDevTraffic(data: DevTrafficData): void {
  blank();
  print('Dev traffic (your devices):');
  if (data.devices.length === 0) {
    muted('  (no dev traffic yet)');
    return;
  }

  for (const device of data.devices) {
    print(`  ${device.device} (${device.totalEvents} events)`);
    for (const { path, count } of device.topPaths) {
      muted(`    ${String(count).padStart(3)} │ ${path}`);
    }
  }

  muted(`\n  (${data.totalDevEvents} total dev events excluded from unique counts)`);
}
