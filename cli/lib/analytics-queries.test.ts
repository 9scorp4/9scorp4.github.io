/**
 * Tests for analytics query functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTopPages,
  getCommandUsage,
  getArticleEngagement,
  getCountryDistribution,
  getSubmissions,
  getReferrerBreakdown,
  getDeviceBreakdown,
  getNodeClicks,
  getSpecimenOpens,
  getOutboundClicks,
  SEARCH_DOMAINS,
  SOCIAL_DOMAINS,
} from './analytics-queries.ts';

// Mock environment variables
beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_TOKEN', 'test-token');
  vi.stubEnv('CF_ACCOUNT_ID', 'test-account');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// Helper to mock fetch responses
function mockFetchResponse(data: Record<string, unknown>[]) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data, meta: [], rows: data.length }),
  } as Response);
}

describe('domain categorization constants', () => {
  it('includes common search engines', () => {
    expect(SEARCH_DOMAINS).toContain('google');
    expect(SEARCH_DOMAINS).toContain('bing');
    expect(SEARCH_DOMAINS).toContain('duckduckgo');
  });

  it('includes common social platforms', () => {
    expect(SOCIAL_DOMAINS).toContain('twitter');
    expect(SOCIAL_DOMAINS).toContain('x.com');
    expect(SOCIAL_DOMAINS).toContain('linkedin');
    expect(SOCIAL_DOMAINS).toContain('mastodon');
  });
});

describe('getTopPages', () => {
  it('returns typed page view data', async () => {
    mockFetchResponse([
      { path: '/', views: 100 },
      { path: '/cuaderno', views: 50 },
    ]);

    const result = await getTopPages(7);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ path: '/', views: 100 });
    expect(result[1]).toEqual({ path: '/cuaderno', views: 50 });
  });

  it('returns empty array when no data', async () => {
    mockFetchResponse([]);
    const result = await getTopPages(7);
    expect(result).toEqual([]);
  });
});

describe('getCommandUsage', () => {
  it('converts is_secret string to boolean', async () => {
    mockFetchResponse([
      { command: 'ayuda', uses: 10, is_secret: '' },
      { command: 'secreto', uses: 5, is_secret: 'secret' },
    ]);

    const result = await getCommandUsage(7);

    expect(result[0].isSecret).toBe(false);
    expect(result[1].isSecret).toBe(true);
  });
});

describe('getArticleEngagement', () => {
  it('rounds time and scroll depth values', async () => {
    mockFetchResponse([
      { path: '/cuaderno/test', reads: 5, avg_read_time: 123.456, avg_scroll_depth: 78.9 },
    ]);

    const result = await getArticleEngagement(7);

    expect(result[0].avgTime).toBe(123);
    expect(result[0].avgScrollDepth).toBe(79);
  });

  it('handles null values gracefully', async () => {
    mockFetchResponse([
      { path: '/cuaderno/test', reads: 5, avg_read_time: null, avg_scroll_depth: null },
    ]);

    const result = await getArticleEngagement(7);

    expect(result[0].avgTime).toBe(0);
    expect(result[0].avgScrollDepth).toBe(0);
  });
});

describe('getCountryDistribution', () => {
  it('returns typed country data', async () => {
    mockFetchResponse([
      { country: 'US', events: 50 },
      { country: 'CO', events: 30 },
    ]);

    const result = await getCountryDistribution(7);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ country: 'US', events: 50 });
  });
});

describe('getSubmissions', () => {
  it('returns typed submission data', async () => {
    mockFetchResponse([
      { status: 'pending', total: 3 },
      { status: 'approved', total: 10 },
    ]);

    const result = await getSubmissions(7);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ status: 'pending', total: 3 });
  });
});

describe('getReferrerBreakdown', () => {
  it('categorizes referrers correctly', async () => {
    mockFetchResponse([
      { referrer: '', visits: 100 },
      { referrer: 'google.com', visits: 50 },
      { referrer: 'twitter.com', visits: 30 },
      { referrer: 'unknown-site.com', visits: 20 },
    ]);

    const result = await getReferrerBreakdown(7);

    expect(result.direct).toBe(100);
    expect(result.search).toBe(50);
    expect(result.social).toBe(30);
    expect(result.other).toBe(20);
  });

  it('handles mixed case referrers', async () => {
    mockFetchResponse([
      { referrer: 'GOOGLE.COM', visits: 25 },
      { referrer: 'Twitter.Com', visits: 15 },
    ]);

    const result = await getReferrerBreakdown(7);

    expect(result.search).toBe(25);
    expect(result.social).toBe(15);
  });

  it('handles null referrers as direct', async () => {
    mockFetchResponse([
      { referrer: null, visits: 50 },
    ]);

    const result = await getReferrerBreakdown(7);
    expect(result.direct).toBe(50);
  });
});

describe('getDeviceBreakdown', () => {
  it('returns typed device data', async () => {
    mockFetchResponse([
      { device_type: 'desktop', visits: 60 },
      { device_type: 'mobile', visits: 40 },
    ]);

    const result = await getDeviceBreakdown(7);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ deviceType: 'desktop', visits: 60 });
  });
});

describe('getNodeClicks', () => {
  it('returns typed node click data', async () => {
    mockFetchResponse([
      { node_type: 'track', node_label: 'Song Title', clicks: 5 },
    ]);

    const result = await getNodeClicks(7);

    expect(result[0]).toEqual({
      nodeType: 'track',
      nodeLabel: 'Song Title',
      clicks: 5,
    });
  });
});

describe('getSpecimenOpens', () => {
  it('handles null series correctly', async () => {
    mockFetchResponse([
      { specimen_name: 'redflag', series: null, opens: 10 },
      { specimen_name: 'particles', series: 'experiments', opens: 5 },
    ]);

    const result = await getSpecimenOpens(7);

    expect(result[0].series).toBeNull();
    expect(result[1].series).toBe('experiments');
  });
});

describe('getOutboundClicks', () => {
  it('returns typed outbound click data', async () => {
    mockFetchResponse([
      { domain: 'github.com', clicks: 15 },
    ]);

    const result = await getOutboundClicks(7);

    expect(result[0]).toEqual({ domain: 'github.com', clicks: 15 });
  });
});

describe('error handling', () => {
  it('throws on API error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as Response);

    await expect(getTopPages(7)).rejects.toThrow('Analytics API error 403: Forbidden');
  });

  it('throws when credentials missing', async () => {
    vi.stubEnv('CLOUDFLARE_API_TOKEN', '');
    vi.stubEnv('CF_ACCOUNT_ID', '');

    await expect(getTopPages(7)).rejects.toThrow('CF_API_TOKEN and CF_ACCOUNT_ID required');
  });
});
