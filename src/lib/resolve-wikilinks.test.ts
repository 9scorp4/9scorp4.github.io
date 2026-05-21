import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveWikilinks, hasWikilinks } from './resolve-wikilinks.ts';

describe('resolveWikilinks', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // Basic links
  it('resolves journal links', () => {
    const result = resolveWikilinks('See [[journal:my-article]].');
    expect(result).toBe('See <a href="/cuaderno/my-article/">my-article</a>.');
  });

  it('resolves specimen links', () => {
    const result = resolveWikilinks('Check [[specimen:particle-flow]].');
    expect(result).toBe('Check <a href="/#particle-flow">particle-flow</a>.');
  });

  it('resolves library links', () => {
    const result = resolveWikilinks('In the [[library:references]].');
    expect(result).toBe('In the <a href="/#library-references">references</a>.');
  });

  // Fragment handling
  it('resolves links with heading fragments', () => {
    const result = resolveWikilinks('See [[journal:my-article#section-one]].');
    expect(result).toBe('See <a href="/cuaderno/my-article/#section-one">my-article</a>.');
  });

  it('resolves links with block anchor fragments (^anchor)', () => {
    const result = resolveWikilinks('See [[journal:my-article#^important-point]].');
    // ^anchor prefix is stripped in URL
    expect(result).toBe('See <a href="/cuaderno/my-article/#important-point">my-article</a>.');
  });

  // Display text
  it('uses custom display text when provided', () => {
    const result = resolveWikilinks('Read [[journal:my-article|this great piece]].');
    expect(result).toBe('Read <a href="/cuaderno/my-article/">this great piece</a>.');
  });

  it('uses custom display text with fragments', () => {
    const result = resolveWikilinks('See [[journal:my-article#^anchor|the key insight]].');
    expect(result).toBe('See <a href="/cuaderno/my-article/#anchor">the key insight</a>.');
  });

  // Multiple wikilinks
  it('resolves multiple wikilinks in same text', () => {
    const result = resolveWikilinks('See [[journal:first]] and [[journal:second]].');
    expect(result).toBe(
      'See <a href="/cuaderno/first/">first</a> and <a href="/cuaderno/second/">second</a>.'
    );
  });

  // Unknown collection
  it('escapes and warns for unknown collections', () => {
    const result = resolveWikilinks('See [[unknown:something]].');
    expect(result).toBe('See [[unknown:something]].');
    expect(warnSpy).toHaveBeenCalledWith('[resolve-wikilinks] Unknown collection: unknown');
  });

  // HTML escaping
  it('escapes HTML in display text', () => {
    const result = resolveWikilinks('See [[journal:my-article|<script>alert("xss")</script>]].');
    expect(result).toBe(
      'See <a href="/cuaderno/my-article/">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</a>.'
    );
  });

  it('escapes HTML in URLs and link text', () => {
    const result = resolveWikilinks('See [[journal:test"article]].');
    // Both the URL and link text are escaped
    expect(result).toBe('See <a href="/cuaderno/test&quot;article/">test&quot;article</a>.');
  });

  // Edge cases
  it('returns unchanged text when no wikilinks', () => {
    const text = 'Just regular text without any links.';
    expect(resolveWikilinks(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(resolveWikilinks('')).toBe('');
  });

  it('handles special characters in slugs', () => {
    // Uses actual journal entry slug - lookup maps to folder name with numeric prefix
    const result = resolveWikilinks('See [[journal:lo-que-corrige-el-mapa]].');
    expect(result).toBe('See <a href="/cuaderno/01_lo-que-corrige-el-mapa/">lo-que-corrige-el-mapa</a>.');
  });
});

describe('hasWikilinks', () => {
  // Note: hasWikilinks uses a global regex, so we test each case independently
  // to avoid lastIndex issues between tests

  it('returns true for journal wikilinks', () => {
    expect(hasWikilinks('See [[journal:my-article]].')).toBe(true);
  });

  it('returns true for specimen wikilinks', () => {
    expect(hasWikilinks('[[specimen:test]]')).toBe(true);
  });

  it('returns true for wikilinks with display text', () => {
    expect(hasWikilinks('Text with [[journal:a|link]] in middle')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasWikilinks('Just regular text.')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasWikilinks('')).toBe(false);
  });

  it('returns false for markdown links', () => {
    expect(hasWikilinks('Text with [regular markdown](link).')).toBe(false);
  });

  it('returns false for malformed wikilinks without collection', () => {
    expect(hasWikilinks('[[not-valid]]')).toBe(false);
  });

  it('returns false for single bracket syntax', () => {
    expect(hasWikilinks('[journal:slug]')).toBe(false);
  });
});
