/**
 * Type definitions for analytics queries
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnalyticsRow = Record<string, any>;

export interface AnalyticsResponse {
  data: AnalyticsRow[];
  meta: { name: string; type: string }[];
  rows: number;
}

// Query return types
export interface UniqueVisitorsData {
  totalVisitors: number;
  totalEvents: number;
  pagesPerVisitor: string;
  newVisitors: number;
  returning: number;
}

export interface PageViewData {
  path: string;
  views: number;
}

export interface CommandUsageData {
  command: string;
  uses: number;
  isSecret: boolean;
}

export interface ArticleEngagementData {
  path: string;
  reads: number;
  avgTime: number;
  avgScrollDepth: number;
}

export interface CountryData {
  country: string;
  events: number;
}

export interface SubmissionData {
  status: string;
  total: number;
}

export interface ReferrerBreakdownData {
  direct: number;
  search: number;
  social: number;
  other: number;
}

export interface DeviceData {
  deviceType: string;
  visits: number;
}

export interface TimeOfDayData {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface NodeClickData {
  nodeType: string;
  nodeLabel: string;
  clicks: number;
}

export interface SpecimenOpenData {
  specimenName: string;
  series: string | null;
  opens: number;
}

export interface OutboundClickData {
  domain: string;
  clicks: number;
}

export interface DevTrafficDevice {
  device: string;
  totalEvents: number;
  topPaths: Array<{ path: string; count: number }>;
}

export interface DevTrafficData {
  devices: DevTrafficDevice[];
  totalDevEvents: number;
}
