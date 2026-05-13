/**
 * Tests for analytics formatter functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
} from './analytics-formatters.ts';

// Capture console output
let printOutput: string[] = [];
let mutedOutput: string[] = [];

vi.mock('./cli-style.ts', () => ({
  print: (msg: string) => printOutput.push(msg),
  muted: (msg: string) => mutedOutput.push(msg),
  blank: () => {},
}));

beforeEach(() => {
  printOutput = [];
  mutedOutput = [];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('displayUniqueVisitors', () => {
  it('shows null state message when no data', () => {
    displayUniqueVisitors(null);

    expect(printOutput).toContain('Unique visitors:');
    expect(mutedOutput.some(m => m.includes('no data yet'))).toBe(true);
  });

  it('formats visitor stats correctly', () => {
    displayUniqueVisitors({
      totalVisitors: 42,
      totalEvents: 126,
      pagesPerVisitor: '3.0',
      newVisitors: 30,
      returning: 12,
    });

    expect(printOutput.some(p => p.includes('42 unique'))).toBe(true);
    expect(printOutput.some(p => p.includes('126 pageviews'))).toBe(true);
    expect(printOutput.some(p => p.includes('3.0 pages/visitor'))).toBe(true);
    expect(printOutput.some(p => p.includes('30 new'))).toBe(true);
    expect(printOutput.some(p => p.includes('12 returning'))).toBe(true);
  });
});

describe('displayTopPages', () => {
  it('shows empty state when no data', () => {
    displayTopPages([]);
    expect(mutedOutput.some(m => m.includes('no data yet'))).toBe(true);
  });

  it('pads view counts for alignment', () => {
    displayTopPages([
      { path: '/', views: 5 },
      { path: '/test', views: 1000 },
    ]);

    // Check padStart alignment (4 chars)
    expect(printOutput.some(p => p.includes('   5 │ /'))).toBe(true);
    expect(printOutput.some(p => p.includes('1000 │ /test'))).toBe(true);
  });
});

describe('displayCommandUsage', () => {
  it('marks secret commands with asterisk', () => {
    displayCommandUsage([
      { command: 'ayuda', uses: 10, isSecret: false },
      { command: 'secreto', uses: 5, isSecret: true },
    ]);

    expect(printOutput.some(p => p.includes('ayuda') && !p.includes('*'))).toBe(true);
    expect(printOutput.some(p => p.includes('secreto *'))).toBe(true);
  });
});

describe('displayArticleEngagement', () => {
  it('formats engagement metrics correctly', () => {
    displayArticleEngagement([{
      path: '/cuaderno/test',
      reads: 5,
      avgTime: 120,
      avgScrollDepth: 75,
    }]);

    expect(printOutput.some(p =>
      p.includes('5 reads') &&
      p.includes('120s avg') &&
      p.includes('75% scroll')
    )).toBe(true);
  });
});

describe('displayCountryDistribution', () => {
  it('formats country data correctly', () => {
    displayCountryDistribution([
      { country: 'US', events: 50 },
      { country: 'CO', events: 30 },
    ]);

    expect(printOutput.some(p => p.includes('50') && p.includes('US'))).toBe(true);
    expect(printOutput.some(p => p.includes('30') && p.includes('CO'))).toBe(true);
  });
});

describe('displaySubmissions', () => {
  it('formats submission status correctly', () => {
    displaySubmissions([
      { status: 'approved', total: 10 },
      { status: 'pending', total: 3 },
    ]);

    expect(printOutput.some(p => p.includes('10') && p.includes('approved'))).toBe(true);
    expect(printOutput.some(p => p.includes('3') && p.includes('pending'))).toBe(true);
  });
});

describe('displayReferrerBreakdown', () => {
  it('shows empty state when all zeros', () => {
    displayReferrerBreakdown({ direct: 0, search: 0, social: 0, other: 0 });
    expect(mutedOutput.some(m => m.includes('no data yet'))).toBe(true);
  });

  it('sorts categories by count descending', () => {
    displayReferrerBreakdown({ direct: 10, search: 50, social: 30, other: 5 });

    // Find indices of each category in output
    const searchIdx = printOutput.findIndex(p => p.includes('search'));
    const socialIdx = printOutput.findIndex(p => p.includes('social'));
    const directIdx = printOutput.findIndex(p => p.includes('direct'));

    expect(searchIdx).toBeLessThan(socialIdx);
    expect(socialIdx).toBeLessThan(directIdx);
  });

  it('excludes zero-count categories', () => {
    displayReferrerBreakdown({ direct: 100, search: 0, social: 50, other: 0 });

    expect(printOutput.some(p => p.includes('direct'))).toBe(true);
    expect(printOutput.some(p => p.includes('social'))).toBe(true);
    expect(printOutput.every(p => !p.includes('search'))).toBe(true);
    expect(printOutput.every(p => !p.includes('other'))).toBe(true);
  });
});

describe('displayDeviceBreakdown', () => {
  it('formats device types correctly', () => {
    displayDeviceBreakdown([
      { deviceType: 'desktop', visits: 60 },
      { deviceType: 'mobile', visits: 40 },
    ]);

    expect(printOutput.some(p => p.includes('desktop'))).toBe(true);
    expect(printOutput.some(p => p.includes('mobile'))).toBe(true);
  });
});

describe('displayTimeOfDay', () => {
  it('shows null state message when no data', () => {
    displayTimeOfDay(null);
    expect(mutedOutput.some(m => m.includes('no data yet'))).toBe(true);
  });

  it('formats time buckets with labels', () => {
    displayTimeOfDay({ morning: 10, afternoon: 20, evening: 15, night: 5 });

    expect(printOutput.some(p => p.includes('morning (6-12)'))).toBe(true);
    expect(printOutput.some(p => p.includes('afternoon (12-18)'))).toBe(true);
    expect(printOutput.some(p => p.includes('evening (18-23)'))).toBe(true);
    expect(printOutput.some(p => p.includes('night (23-6)'))).toBe(true);
  });
});

describe('displayNodeClicks', () => {
  it('truncates long labels to 40 chars', () => {
    displayNodeClicks([{
      nodeType: 'track',
      nodeLabel: 'A very long song title that exceeds forty characters definitely',
      clicks: 5,
    }]);

    const output = printOutput.find(p => p.includes('track'));
    expect(output).toBeDefined();
    // Label should be truncated
    expect(output!.length).toBeLessThan(80);
  });
});

describe('displaySpecimenOpens', () => {
  it('omits series suffix when null', () => {
    displaySpecimenOpens([{ specimenName: 'redflag', series: null, opens: 10 }]);
    expect(printOutput.some(p => p.includes('redflag') && !p.includes('('))).toBe(true);
  });

  it('includes series in parentheses when present', () => {
    displaySpecimenOpens([{ specimenName: 'particles', series: 'experiments', opens: 5 }]);
    expect(printOutput.some(p => p.includes('particles (experiments)'))).toBe(true);
  });
});

describe('displayOutboundClicks', () => {
  it('formats outbound domains correctly', () => {
    displayOutboundClicks([{ domain: 'github.com', clicks: 15 }]);
    expect(printOutput.some(p => p.includes('15') && p.includes('github.com'))).toBe(true);
  });
});

describe('displayDevTraffic', () => {
  it('shows empty state when no devices', () => {
    displayDevTraffic({ devices: [], totalDevEvents: 0 });
    expect(mutedOutput.some(m => m.includes('no dev traffic yet'))).toBe(true);
  });

  it('groups data by device', () => {
    displayDevTraffic({
      devices: [
        {
          device: 'laptop',
          totalEvents: 50,
          topPaths: [{ path: 'pageview: /', count: 30 }],
        },
        {
          device: 'phone',
          totalEvents: 20,
          topPaths: [{ path: 'pageview: /cuaderno', count: 15 }],
        },
      ],
      totalDevEvents: 70,
    });

    expect(printOutput.some(p => p.includes('laptop (50 events)'))).toBe(true);
    expect(printOutput.some(p => p.includes('phone (20 events)'))).toBe(true);
    expect(mutedOutput.some(m => m.includes('70 total dev events'))).toBe(true);
  });
});
