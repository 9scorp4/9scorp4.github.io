/**
 * Analytics query functions - barrel export
 *
 * Re-exports all analytics query functions for backward compatibility.
 * Individual modules can be imported directly for smaller bundles.
 */

// Core infrastructure
export { queryAnalytics, SEARCH_DOMAINS, SOCIAL_DOMAINS } from './analytics-base.ts';

// Visitor metrics
export { getUniqueVisitors } from './analytics-visitor-metrics.ts';

// Traffic metrics
export {
  getTopPages,
  getCountryDistribution,
  getReferrerBreakdown,
  getDeviceBreakdown,
  getTimeOfDay,
} from './analytics-traffic-metrics.ts';

// Engagement metrics
export {
  getCommandUsage,
  getArticleEngagement,
  getSubmissions,
} from './analytics-engagement-metrics.ts';

// Interaction metrics
export {
  getNodeClicks,
  getSpecimenOpens,
  getOutboundClicks,
  getDevTraffic,
} from './analytics-interaction-metrics.ts';
