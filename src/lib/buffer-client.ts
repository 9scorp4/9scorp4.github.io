/**
 * Buffer GraphQL API client for scheduling Instagram posts.
 * Handles post creation, media upload, and channel listing.
 */

const BUFFER_API_URL = 'https://api.buffer.com/graphql';

export interface BufferConfig {
  apiKey: string;
  channelId: string;
}

export interface BufferPostInput {
  channelId: string;
  text: string;
  imageUrl: string;
  altText?: string;
  scheduledAt?: Date;
  firstComment?: string;
}

export interface BufferCarouselInput {
  channelId: string;
  text: string;
  imageUrls: string[];
  scheduledAt?: Date;
  firstComment?: string;
}

export interface BufferChannel {
  id: string;
  service: string;
  name: string;
  avatar?: string;
}

export interface BufferPostResult {
  id: string;
  scheduledAt?: string;
}

/**
 * Load Buffer configuration from environment variables.
 */
export function loadBufferConfig(): BufferConfig {
  const apiKey = process.env.BUFFER_API_KEY;
  const channelId = process.env.BUFFER_CHANNEL_ID;

  if (!apiKey) {
    throw new Error('Missing BUFFER_API_KEY environment variable');
  }
  if (!channelId) {
    throw new Error('Missing BUFFER_CHANNEL_ID environment variable');
  }

  return { apiKey, channelId };
}

/**
 * Execute a GraphQL query against Buffer's API.
 */
async function graphql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Buffer API error ${response.status}: ${text}`);
  }

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Buffer GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data as T;
}

/**
 * Fetch connected channels from Buffer account.
 */
export async function getChannels(apiKey: string): Promise<BufferChannel[]> {
  const query = `
    query GetChannels {
      account {
        channels {
          id
          service
          name
          avatar
        }
      }
    }
  `;

  const data = await graphql<{ account: { channels: BufferChannel[] } }>(apiKey, query);
  return data.account.channels;
}

/**
 * Get the organization ID for a channel.
 * Queries all channels and finds the matching one.
 */
export async function getOrganizationId(apiKey: string, channelId: string): Promise<string> {
  const query = `
    query GetChannelsWithOrg {
      account {
        channels {
          id
          organizationId
        }
      }
    }
  `;
  const data = await graphql<{ account: { channels: Array<{ id: string; organizationId: string }> } }>(
    apiKey, query
  );
  const channel = data.account.channels.find(c => c.id === channelId);
  if (!channel) {
    throw new Error(`Channel ${channelId} not found in account`);
  }
  return channel.organizationId;
}

export interface ScheduledPost {
  id: string;
  dueAt: string;
}

/**
 * Fetch scheduled posts from Buffer queue for a channel.
 */
export async function getScheduledPosts(
  apiKey: string,
  organizationId: string,
  channelId: string
): Promise<ScheduledPost[]> {
  const query = `
    query GetScheduledPosts($orgId: OrganizationId!, $channelId: ChannelId!) {
      posts(
        first: 100,
        input: {
          organizationId: $orgId,
          filter: { status: [scheduled], channelIds: [$channelId] }
        }
      ) {
        edges { node { id, dueAt } }
      }
    }
  `;
  const data = await graphql<{ posts: { edges: Array<{ node: ScheduledPost }> } }>(
    apiKey, query, { orgId: organizationId, channelId }
  );
  return data.posts.edges.map(e => e.node);
}

/**
 * Create a scheduled post on Buffer.
 *
 * @param apiKey - Buffer API key
 * @param input - Post content and scheduling options
 * @returns Post ID and scheduled time
 */
export async function createPost(
  apiKey: string,
  input: BufferPostInput
): Promise<BufferPostResult> {
  // Build the caption - include hashtags in text since firstComment isn't in the API
  const fullText = input.firstComment
    ? `${input.text}\n\n${input.firstComment}`
    : input.text;

  // Build mutation with inline enum values (Buffer's GraphQL doesn't accept them as variables)
  const dueAt = input.scheduledAt?.toISOString();
  const modeEnum = input.scheduledAt ? 'customScheduled' : 'addToQueue';
  const dueAtClause = dueAt ? `dueAt: "${dueAt}",` : '';

  const mutation = `
    mutation CreatePost {
      createPost(input: {
        text: ${JSON.stringify(fullText)},
        channelId: "${input.channelId}",
        schedulingType: automatic,
        mode: ${modeEnum},
        ${dueAtClause}
        metadata: {
          instagram: {
            type: post,
            shouldShareToFeed: true
          }
        },
        assets: {
          images: [{ url: ${JSON.stringify(input.imageUrl)} }]
        }
      }) {
        ... on PostActionSuccess {
          post {
            id
            dueAt
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  interface CreatePostResponse {
    createPost: {
      post?: { id: string; dueAt?: string };
      message?: string;
    };
  }

  const data = await graphql<CreatePostResponse>(apiKey, mutation);

  if (data.createPost.message) {
    throw new Error(`Buffer error: ${data.createPost.message}`);
  }

  return {
    id: data.createPost.post!.id,
    scheduledAt: data.createPost.post!.dueAt,
  };
}

/**
 * Create a scheduled carousel post on Buffer.
 * Instagram carousels support 2-10 images.
 *
 * @param apiKey - Buffer API key
 * @param input - Carousel content and scheduling options
 * @returns Post ID and scheduled time
 */
export async function createCarouselPost(
  apiKey: string,
  input: BufferCarouselInput
): Promise<BufferPostResult> {
  if (input.imageUrls.length < 2) {
    throw new Error('Carousel requires at least 2 images');
  }
  if (input.imageUrls.length > 10) {
    throw new Error('Carousel supports maximum 10 images');
  }

  // Build the caption - include hashtags in text since firstComment isn't in the API
  const fullText = input.firstComment
    ? `${input.text}\n\n${input.firstComment}`
    : input.text;

  // Build images array
  const imagesJson = input.imageUrls.map(url => `{ url: ${JSON.stringify(url)} }`).join(', ');

  // Build mutation with inline enum values
  const dueAt = input.scheduledAt?.toISOString();
  const modeEnum = input.scheduledAt ? 'customScheduled' : 'addToQueue';
  const dueAtClause = dueAt ? `dueAt: "${dueAt}",` : '';

  const mutation = `
    mutation CreateCarouselPost {
      createPost(input: {
        text: ${JSON.stringify(fullText)},
        channelId: "${input.channelId}",
        schedulingType: automatic,
        mode: ${modeEnum},
        ${dueAtClause}
        metadata: {
          instagram: {
            type: carousel,
            shouldShareToFeed: true
          }
        },
        assets: {
          images: [${imagesJson}]
        }
      }) {
        ... on PostActionSuccess {
          post {
            id
            dueAt
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  interface CreatePostResponse {
    createPost: {
      post?: { id: string; dueAt?: string };
      message?: string;
    };
  }

  const data = await graphql<CreatePostResponse>(apiKey, mutation);

  if (data.createPost.message) {
    throw new Error(`Buffer error: ${data.createPost.message}`);
  }

  return {
    id: data.createPost.post!.id,
    scheduledAt: data.createPost.post!.dueAt,
  };
}

/**
 * Format a scheduled time for display in America/Montreal timezone.
 */
export function formatScheduledTime(date: Date): string {
  return date.toLocaleString('en-CA', {
    timeZone: 'America/Montreal',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Parse a local time string (America/Montreal) into a Date object.
 * Accepts formats like "2026-05-08 14:30" or "2026-05-08T14:30".
 */
export function parseLocalTime(input: string): Date {
  // Normalize separator
  const normalized = input.replace(' ', 'T');

  // Parse as local time in America/Montreal
  // Create date in local timezone then convert
  const [datePart, timePart] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  // Create a date string that will be interpreted as America/Montreal time
  const localDate = new Date(year, month - 1, day, hour, minute);

  // Get offset for America/Montreal at this time
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montreal',
    timeZoneName: 'longOffset',
  });
  const parts = formatter.formatToParts(localDate);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName');
  const offsetMatch = offsetPart?.value?.match(/GMT([+-]\d{2}):?(\d{2})?/);

  if (offsetMatch) {
    const offsetHours = parseInt(offsetMatch[1], 10);
    const offsetMinutes = parseInt(offsetMatch[2] || '0', 10);
    const offsetMs = (offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes)) * 60 * 1000;

    // Adjust the local date to UTC
    return new Date(localDate.getTime() - offsetMs);
  }

  // Fallback: assume -4 or -5 based on rough DST estimate
  const isDST = month > 3 && month < 11;
  const offset = isDST ? -4 : -5;
  return new Date(localDate.getTime() - offset * 60 * 60 * 1000);
}

/**
 * Get common scheduling times relative to now (America/Montreal).
 */
export function getScheduleOptions(): Array<{ label: string; value: Date | null }> {
  const now = new Date();

  // Tomorrow 9:00 AM EST
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  // Tomorrow 6:00 PM EST
  const tomorrow6pm = new Date(now);
  tomorrow6pm.setDate(tomorrow6pm.getDate() + 1);
  tomorrow6pm.setHours(18, 0, 0, 0);

  return [
    { label: 'Now (add to queue)', value: null },
    { label: `Tomorrow 9:00 AM (${formatScheduledTime(tomorrow9am)})`, value: tomorrow9am },
    { label: `Tomorrow 6:00 PM (${formatScheduledTime(tomorrow6pm)})`, value: tomorrow6pm },
  ];
}
