import { describe, it, expect } from 'vitest';
import {
  buildGraph,
  createNodeId,
  createExitNodeId,
  detectPlatform,
  daysBetween,
  similarBpm,
  normalizeKey,
  type TrackData,
  type ArticleData,
  type CultivationData,
  type AhoraLink,
  type GraphInput,
} from './mycelium-graph.ts';

describe('createNodeId', () => {
  it('creates stable ID from artist and title', () => {
    const id1 = createNodeId('Artist Name', 'Song Title');
    const id2 = createNodeId('Artist Name', 'Song Title');
    expect(id1).toBe(id2);
  });

  it('normalizes case', () => {
    const id1 = createNodeId('ARTIST', 'TITLE');
    const id2 = createNodeId('artist', 'title');
    expect(id1).toBe(id2);
  });

  it('trims whitespace', () => {
    const id1 = createNodeId('  Artist  ', '  Title  ');
    const id2 = createNodeId('Artist', 'Title');
    expect(id1).toBe(id2);
  });

  it('produces different IDs for different inputs', () => {
    const id1 = createNodeId('Artist A', 'Song');
    const id2 = createNodeId('Artist B', 'Song');
    expect(id1).not.toBe(id2);
  });

  it('starts with t prefix', () => {
    const id = createNodeId('Artist', 'Title');
    expect(id).toMatch(/^t/);
  });
});

describe('createExitNodeId', () => {
  it('creates stable ID from URL', () => {
    const url = 'https://spotify.com/track/abc123';
    const id1 = createExitNodeId(url);
    const id2 = createExitNodeId(url);
    expect(id1).toBe(id2);
  });

  it('produces different IDs for different URLs', () => {
    const id1 = createExitNodeId('https://spotify.com/track/a');
    const id2 = createExitNodeId('https://spotify.com/track/b');
    expect(id1).not.toBe(id2);
  });

  it('starts with x prefix', () => {
    const id = createExitNodeId('https://example.com');
    expect(id).toMatch(/^x/);
  });
});

describe('detectPlatform', () => {
  it('detects Spotify URLs', () => {
    expect(detectPlatform('https://open.spotify.com/track/abc')).toBe('spotify');
    expect(detectPlatform('https://spotify.com/track/abc')).toBe('spotify');
  });

  it('detects YouTube URLs', () => {
    expect(detectPlatform('https://youtube.com/watch?v=abc')).toBe('youtube');
    expect(detectPlatform('https://www.youtube.com/watch?v=abc')).toBe('youtube');
    expect(detectPlatform('https://youtu.be/abc')).toBe('youtube');
  });

  it('detects Bandcamp URLs', () => {
    expect(detectPlatform('https://artist.bandcamp.com/track/song')).toBe('bandcamp');
  });

  it('detects SoundCloud URLs', () => {
    expect(detectPlatform('https://soundcloud.com/artist/track')).toBe('soundcloud');
  });

  it('detects GitHub URLs', () => {
    expect(detectPlatform('https://github.com/user/repo')).toBe('github');
  });

  it('returns external for unknown URLs', () => {
    expect(detectPlatform('https://example.com/page')).toBe('external');
    expect(detectPlatform('https://random-site.org')).toBe('external');
  });

  it('returns external for invalid URLs', () => {
    expect(detectPlatform('not-a-url')).toBe('external');
    expect(detectPlatform('')).toBe('external');
  });
});

describe('daysBetween', () => {
  it('calculates days between dates', () => {
    expect(daysBetween('2026-05-01', '2026-05-03')).toBe(2);
    expect(daysBetween('2026-05-10', '2026-05-01')).toBe(9);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-05-01', '2026-05-01')).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(daysBetween('2026-04-30', '2026-05-01')).toBe(1);
  });

  it('handles year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('is symmetric (order does not matter)', () => {
    const days1 = daysBetween('2026-05-01', '2026-05-10');
    const days2 = daysBetween('2026-05-10', '2026-05-01');
    expect(days1).toBe(days2);
  });
});

describe('similarBpm', () => {
  it('returns true for BPMs within 10', () => {
    expect(similarBpm(120, 125)).toBe(true);
    expect(similarBpm(120, 115)).toBe(true);
    expect(similarBpm(120, 130)).toBe(true);
  });

  it('returns false for BPMs more than 10 apart', () => {
    expect(similarBpm(120, 131)).toBe(false);
    expect(similarBpm(120, 109)).toBe(false);
  });

  it('returns false when either BPM is undefined', () => {
    expect(similarBpm(120, undefined)).toBe(false);
    expect(similarBpm(undefined, 120)).toBe(false);
    expect(similarBpm(undefined, undefined)).toBe(false);
  });

  it('returns true for exact match', () => {
    expect(similarBpm(120, 120)).toBe(true);
  });
});

describe('normalizeKey', () => {
  it('normalizes key to lowercase', () => {
    expect(normalizeKey('Am')).toBe('am');
    expect(normalizeKey('C#')).toBe('c#');
    expect(normalizeKey('Db')).toBe('db');
  });

  it('removes minor/major suffixes', () => {
    expect(normalizeKey('A minor')).toBe('a');
    expect(normalizeKey('C major')).toBe('c');
    expect(normalizeKey('A min')).toBe('a');
    expect(normalizeKey('C maj')).toBe('c');
  });

  it('returns null for undefined', () => {
    expect(normalizeKey(undefined)).toBe(null);
  });

  it('returns null for empty string', () => {
    expect(normalizeKey('')).toBe(null);
  });
});

describe('buildGraph', () => {
  it('creates track nodes from input', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'Artist', title: 'Song', url: 'https://spotify.com/track/a', date: '2026-05-01' },
      ],
      articles: [],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const trackNodes = graph.nodes.filter(n => n.type === 'track');

    expect(trackNodes).toHaveLength(1);
    expect(trackNodes[0].artist).toBe('Artist');
    expect(trackNodes[0].title).toBe('Song');
  });

  it('deduplicates tracks by artist+title, incrementing appearances', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'Artist', title: 'Song', url: 'https://spotify.com/track/a', date: '2026-05-01' },
        { artist: 'Artist', title: 'Song', url: 'https://spotify.com/track/a', date: '2026-05-02' },
      ],
      articles: [],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const trackNodes = graph.nodes.filter(n => n.type === 'track');

    expect(trackNodes).toHaveLength(1);
    expect(trackNodes[0].appearances).toBe(2);
    expect(trackNodes[0].firstSeen).toBe('2026-05-01'); // keeps earliest date
  });

  it('creates article nodes', () => {
    const input: GraphInput = {
      tracks: [],
      articles: [
        { slug: 'my-article', title: 'My Article', date: '2026-05-01', excerpt: 'Test...', wikilinks: [] },
      ],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const articleNodes = graph.nodes.filter(n => n.type === 'article');

    expect(articleNodes).toHaveLength(1);
    expect(articleNodes[0].id).toBe('a:my-article');
    expect(articleNodes[0].articleTitle).toBe('My Article');
  });

  it('creates cultivation nodes', () => {
    const input: GraphInput = {
      tracks: [],
      articles: [],
      cultivations: [
        { slug: 'my-project', name: 'My Project', status: 'growing', wikilinks: [] },
      ],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const cultNodes = graph.nodes.filter(n => n.type === 'cultivation');

    expect(cultNodes).toHaveLength(1);
    expect(cultNodes[0].id).toBe('c:my-project');
    expect(cultNodes[0].cultivationName).toBe('My Project');
    expect(cultNodes[0].status).toBe('growing');
  });

  it('creates exit nodes from track URLs', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'A', title: 'S', url: 'https://spotify.com/track/x', date: '2026-05-01' },
      ],
      articles: [],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const exitNodes = graph.nodes.filter(n => n.type === 'exit');

    expect(exitNodes).toHaveLength(1);
    expect(exitNodes[0].platform).toBe('spotify');
    expect(exitNodes[0].url).toBe('https://spotify.com/track/x');
  });

  it('creates edges between tracks on same dispatch', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'A1', title: 'S1', url: 'https://x.com/1', date: '2026-05-01' },
        { artist: 'A2', title: 'S2', url: 'https://x.com/2', date: '2026-05-01' },
      ],
      articles: [],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const musicalEdges = graph.edges.filter(e => e.edgeType === 'musical');

    expect(musicalEdges.length).toBeGreaterThan(0);
    expect(musicalEdges[0].reasons).toContain('same dispatch');
  });

  it('creates wikilink edges between articles', () => {
    const input: GraphInput = {
      tracks: [],
      articles: [
        { slug: 'article-a', title: 'A', date: '2026-05-01', excerpt: '', wikilinks: [
          { target: 'journal:article-b', citationType: 'section' }
        ]},
        { slug: 'article-b', title: 'B', date: '2026-05-02', excerpt: '', wikilinks: [] },
      ],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const wikilinkEdges = graph.edges.filter(e => e.edgeType === 'wikilink');

    expect(wikilinkEdges).toHaveLength(1);
    expect(wikilinkEdges[0].reasons).toContain('cites');
    expect(wikilinkEdges[0].citationType).toBe('section');
  });

  it('creates announced edges via ahoraLinks', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'A', title: 'S', url: 'https://x.com', date: '2026-05-01' },
      ],
      articles: [
        { slug: 'article-a', title: 'A', date: '2026-05-01', excerpt: '', wikilinks: [] },
      ],
      cultivations: [],
      ahoraLinks: [
        { date: '2026-05-01', articleSlug: 'article-a' },
      ],
    };

    const graph = buildGraph(input);
    const announcedEdges = graph.edges.filter(e => e.edgeType === 'announced');

    expect(announcedEdges.length).toBeGreaterThan(0);
    expect(announcedEdges[0].reasons).toContain('announced together');
  });

  it('filters edges below weight threshold', () => {
    // Two tracks far apart in time should not create an edge
    const input: GraphInput = {
      tracks: [
        { artist: 'A1', title: 'S1', url: 'https://x.com/1', date: '2026-01-01' },
        { artist: 'A2', title: 'S2', url: 'https://x.com/2', date: '2026-12-31' },
      ],
      articles: [],
      cultivations: [],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);
    const musicalEdges = graph.edges.filter(e => e.edgeType === 'musical');

    // Should have no musical edges since tracks are too far apart
    expect(musicalEdges).toHaveLength(0);
  });

  it('includes metadata in graph', () => {
    const input: GraphInput = {
      tracks: [
        { artist: 'A', title: 'S', url: 'https://x.com', date: '2026-05-01', songbpmId: '123' },
      ],
      articles: [
        { slug: 'a', title: 'A', date: '2026-05-01', excerpt: '', wikilinks: [] },
      ],
      cultivations: [
        { slug: 'c', name: 'C', status: 'growing', wikilinks: [] },
      ],
      ahoraLinks: [],
    };

    const graph = buildGraph(input);

    expect(graph.meta.articleCount).toBe(1);
    expect(graph.meta.cultivationCount).toBe(1);
    expect(graph.meta.tracksFromSongbpm).toBe(1);
    expect(graph.generated).toBeDefined();
  });
});
