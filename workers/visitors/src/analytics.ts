/**
 * Analytics module for garden metrics
 *
 * Writes privacy-respecting events to Cloudflare Analytics Engine.
 * Schema:
 *   blob1: event type (pageview, command, article_read, submission, node_click, specimen_open, outbound_click)
 *   blob2: path or command name or node_type or specimen_name or domain
 *   blob3: country code (from CF-IPCountry)
 *   blob4: referrer domain (pageview), series (specimen_open), context (outbound_click)
 *   blob5: device_type (pageview), node_label (node_click)
 *   blob6: visitor ID (anonymous UUID, 36 chars) — for unique visitor counting
 *   blob7: dev flag ('dev' or '') — marks developer traffic to exclude from stats
 *   blob8: device name (for dev traffic only, e.g. 'macbook-work', 'iphone-main')
 *   double1: read time (article_read), viewport_width (pageview)
 *   double2: scroll depth (article_read)
 *   double3: hour_local (pageview, 0-23)
 */

export type EventType =
  | 'pageview'
  | 'command'
  | 'article_read'
  | 'submission'
  | 'node_click'
  | 'specimen_open'
  | 'outbound_click';

// Common fields for visitor tracking (all events)
interface VisitorFields {
  vid?: string;    // anonymous visitor ID (UUID)
  dev?: boolean;   // is this a developer visit?
  devId?: string;  // device name (only for dev traffic)
}

export interface PageviewEvent extends VisitorFields {
  type: 'pageview';
  path: string;
  referrer?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  viewportWidth?: number;
  hourLocal?: number; // 0-23
}

export interface CommandEvent extends VisitorFields {
  type: 'command';
  command: string;
  isSecret?: boolean;
}

export interface ArticleReadEvent extends VisitorFields {
  type: 'article_read';
  path: string;
  readTime: number; // seconds
  scrollDepth: number; // 0-100 percentage
}

export interface SubmissionEvent extends VisitorFields {
  type: 'submission';
  status: 'received' | 'rate_limited';
}

export interface NodeClickEvent extends VisitorFields {
  type: 'node_click';
  nodeType: 'track' | 'article' | 'cultivation';
  nodeLabel: string;
}

export interface SpecimenOpenEvent extends VisitorFields {
  type: 'specimen_open';
  specimenName: string;
  series?: string;
}

export interface OutboundClickEvent extends VisitorFields {
  type: 'outbound_click';
  domain: string;
  context: string; // page path where click occurred
}

export type AnalyticsEvent =
  | PageviewEvent
  | CommandEvent
  | ArticleReadEvent
  | SubmissionEvent
  | NodeClickEvent
  | SpecimenOpenEvent
  | OutboundClickEvent;

export interface AnalyticsEngine {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

/**
 * Extract referrer domain from full URL, stripping protocol and path
 */
function extractReferrerDomain(referrer: string | undefined): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return '';
  }
}

/**
 * Write an analytics event to the Analytics Engine
 */
export function trackEvent(
  analytics: AnalyticsEngine,
  event: AnalyticsEvent,
  country: string
): void {
  const blobs: string[] = [];
  const doubles: number[] = [];

  // blob1: event type
  blobs[0] = event.type;

  switch (event.type) {
    case 'pageview':
      // blob2: path, blob3: country, blob4: referrer domain, blob5: device_type
      // double1: viewport_width, double3: hour_local
      blobs[1] = event.path;
      blobs[2] = country;
      blobs[3] = extractReferrerDomain(event.referrer);
      blobs[4] = event.deviceType || '';
      if (event.viewportWidth !== undefined) {
        doubles[0] = event.viewportWidth;
      }
      if (event.hourLocal !== undefined) {
        doubles[2] = event.hourLocal;
      }
      break;

    case 'command':
      // blob2: command name, blob3: country, blob5: isSecret flag
      blobs[1] = event.command;
      blobs[2] = country;
      blobs[4] = event.isSecret ? 'secret' : '';
      break;

    case 'article_read':
      // blob2: path, blob3: country, double1: readTime, double2: scrollDepth
      blobs[1] = event.path;
      blobs[2] = country;
      doubles[0] = event.readTime;
      doubles[1] = event.scrollDepth;
      break;

    case 'submission':
      // blob2: status, blob3: country
      blobs[1] = event.status;
      blobs[2] = country;
      break;

    case 'node_click':
      // blob2: node_type, blob3: country, blob5: node_label
      blobs[1] = event.nodeType;
      blobs[2] = country;
      blobs[4] = event.nodeLabel;
      break;

    case 'specimen_open':
      // blob2: specimen_name, blob3: country, blob4: series
      blobs[1] = event.specimenName;
      blobs[2] = country;
      blobs[3] = event.series || '';
      break;

    case 'outbound_click':
      // blob2: domain, blob3: country, blob4: context (page path)
      blobs[1] = event.domain;
      blobs[2] = country;
      blobs[3] = event.context;
      break;
  }

  // Visitor tracking fields (all events)
  // blob6: visitor ID (UUID)
  // blob7: dev flag
  // blob8: device name (dev only)
  if (event.vid) {
    blobs[5] = event.vid;
  }
  blobs[6] = event.dev ? 'dev' : '';
  if (event.devId) {
    blobs[7] = event.devId;
  }

  analytics.writeDataPoint({
    blobs,
    doubles: doubles.length > 0 ? doubles : undefined,
    // Index by event type for efficient querying
    indexes: [event.type],
  });
}

/**
 * Parse and validate visitor tracking fields from request data.
 * Returns an object with vid, dev, and devId fields.
 */
function parseVisitorFields(data: Record<string, unknown>): VisitorFields {
  const fields: VisitorFields = {};

  // Visitor ID: must be a valid UUID (36 chars with dashes)
  if (typeof data.vid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.vid)) {
    fields.vid = data.vid.toLowerCase();
  }

  // Dev flag: boolean
  if (data.dev === true) {
    fields.dev = true;
  }

  // Device ID: alphanumeric + dashes, max 50 chars (only meaningful for dev traffic)
  if (typeof data.devId === 'string' && data.devId.length <= 50 && /^[a-z0-9-]+$/i.test(data.devId)) {
    fields.devId = data.devId.toLowerCase();
  }

  return fields;
}

/**
 * Validate and parse an incoming event from the client
 * Returns null if the event is invalid or should be dropped
 */
export function parseEvent(body: unknown): AnalyticsEvent | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const data = body as Record<string, unknown>;
  const type = data.type;
  const visitorFields = parseVisitorFields(data);

  switch (type) {
    case 'pageview': {
      const path = data.path;
      if (typeof path !== 'string' || !path.startsWith('/')) {
        return null;
      }
      // Sanitize path: remove query params and fragments
      const sanitizedPath = path.split('?')[0].split('#')[0];

      // Validate optional enhanced fields
      let deviceType: 'mobile' | 'tablet' | 'desktop' | undefined;
      if (data.deviceType === 'mobile' || data.deviceType === 'tablet' || data.deviceType === 'desktop') {
        deviceType = data.deviceType;
      }

      let viewportWidth: number | undefined;
      if (typeof data.viewportWidth === 'number' && data.viewportWidth > 0 && data.viewportWidth < 10000) {
        viewportWidth = Math.round(data.viewportWidth);
      }

      let hourLocal: number | undefined;
      if (typeof data.hourLocal === 'number' && data.hourLocal >= 0 && data.hourLocal < 24) {
        hourLocal = Math.round(data.hourLocal);
      }

      return {
        type: 'pageview',
        path: sanitizedPath,
        referrer: typeof data.referrer === 'string' ? data.referrer : undefined,
        deviceType,
        viewportWidth,
        hourLocal,
        ...visitorFields,
      };
    }

    case 'command': {
      const command = data.command;
      if (typeof command !== 'string' || command.length > 50) {
        return null;
      }
      // Only allow alphanumeric commands
      if (!/^[a-z0-9-]+$/i.test(command)) {
        return null;
      }
      return {
        type: 'command',
        command: command.toLowerCase(),
        isSecret: data.isSecret === true,
        ...visitorFields,
      };
    }

    case 'article_read': {
      const path = data.path;
      const readTime = data.readTime;
      const scrollDepth = data.scrollDepth;

      if (typeof path !== 'string' || !path.startsWith('/')) {
        return null;
      }
      if (typeof readTime !== 'number' || readTime < 0 || readTime > 3600) {
        return null;
      }
      if (typeof scrollDepth !== 'number' || scrollDepth < 0 || scrollDepth > 100) {
        return null;
      }

      return {
        type: 'article_read',
        path: path.split('?')[0].split('#')[0],
        readTime: Math.round(readTime),
        scrollDepth: Math.round(scrollDepth),
        ...visitorFields,
      };
    }

    case 'node_click': {
      const nodeType = data.nodeType;
      const nodeLabel = data.nodeLabel;

      if (nodeType !== 'track' && nodeType !== 'article' && nodeType !== 'cultivation') {
        return null;
      }
      if (typeof nodeLabel !== 'string' || nodeLabel.length > 200) {
        return null;
      }

      return {
        type: 'node_click',
        nodeType,
        nodeLabel: nodeLabel.slice(0, 200),
        ...visitorFields,
      };
    }

    case 'specimen_open': {
      const specimenName = data.specimenName;
      if (typeof specimenName !== 'string' || specimenName.length > 100) {
        return null;
      }

      return {
        type: 'specimen_open',
        specimenName: specimenName.slice(0, 100),
        series: typeof data.series === 'string' ? data.series.slice(0, 50) : undefined,
        ...visitorFields,
      };
    }

    case 'outbound_click': {
      const domain = data.domain;
      const context = data.context;

      if (typeof domain !== 'string' || domain.length > 100) {
        return null;
      }
      if (typeof context !== 'string' || !context.startsWith('/')) {
        return null;
      }

      return {
        type: 'outbound_click',
        domain: domain.slice(0, 100),
        context: context.split('?')[0].split('#')[0],
        ...visitorFields,
      };
    }

    default:
      return null;
  }
}
