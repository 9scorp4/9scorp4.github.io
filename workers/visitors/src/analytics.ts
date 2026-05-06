/**
 * Analytics module for garden metrics
 *
 * Writes privacy-respecting events to Cloudflare Analytics Engine.
 * Schema:
 *   blob1: event type (pageview, command, article_read, submission)
 *   blob2: path or command name
 *   blob3: country code (from CF-IPCountry)
 *   blob4: referrer domain (pageview only)
 *   blob5: extra metadata (isSecret for commands, etc.)
 *   double1: read time in seconds (article_read only)
 *   double2: scroll depth percentage (article_read only)
 */

export type EventType = 'pageview' | 'command' | 'article_read' | 'submission';

export interface PageviewEvent {
  type: 'pageview';
  path: string;
  referrer?: string;
}

export interface CommandEvent {
  type: 'command';
  command: string;
  isSecret?: boolean;
}

export interface ArticleReadEvent {
  type: 'article_read';
  path: string;
  readTime: number; // seconds
  scrollDepth: number; // 0-100 percentage
}

export interface SubmissionEvent {
  type: 'submission';
  status: 'received' | 'rate_limited';
}

export type AnalyticsEvent =
  | PageviewEvent
  | CommandEvent
  | ArticleReadEvent
  | SubmissionEvent;

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
      // blob2: path, blob3: country, blob4: referrer domain
      blobs[1] = event.path;
      blobs[2] = country;
      blobs[3] = extractReferrerDomain(event.referrer);
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
  }

  analytics.writeDataPoint({
    blobs,
    doubles: doubles.length > 0 ? doubles : undefined,
    // Index by event type for efficient querying
    indexes: [event.type],
  });
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

  switch (type) {
    case 'pageview': {
      const path = data.path;
      if (typeof path !== 'string' || !path.startsWith('/')) {
        return null;
      }
      // Sanitize path: remove query params and fragments
      const sanitizedPath = path.split('?')[0].split('#')[0];
      return {
        type: 'pageview',
        path: sanitizedPath,
        referrer: typeof data.referrer === 'string' ? data.referrer : undefined,
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
      };
    }

    default:
      return null;
  }
}
