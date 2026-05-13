/**
 * Traffic metrics queries
 *
 * Page views, geographic distribution, referrers, devices, and time-of-day.
 */

import type {
  PageViewData,
  CountryData,
  ReferrerBreakdownData,
  DeviceData,
  TimeOfDayData,
} from './analytics-types.ts';
import { queryAnalytics, SEARCH_DOMAINS, SOCIAL_DOMAINS } from './analytics-base.ts';

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
