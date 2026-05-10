import { describe, it, expect } from 'vitest';
import {
  classifyAnchor,
  extractWikilinks,
  extractExternalLinks,
} from './mycelium-data.ts';

describe('classifyAnchor', () => {
  it('returns section for undefined anchor', () => {
    expect(classifyAnchor(undefined)).toBe('section');
  });

  it('returns text for text fragment anchors', () => {
    expect(classifyAnchor(':~:text=some text')).toBe('text');
  });

  it('returns text for URL-encoded text fragment anchors', () => {
    expect(classifyAnchor(':%7E:text=some text')).toBe('text');
  });

  it('returns block for ^anchor syntax', () => {
    expect(classifyAnchor('^important-point')).toBe('block');
    expect(classifyAnchor('^abc123')).toBe('block');
  });

  it('returns heading for other anchors', () => {
    expect(classifyAnchor('section-one')).toBe('heading');
    expect(classifyAnchor('my-heading')).toBe('heading');
  });
});

describe('extractWikilinks', () => {
  it('extracts basic wikilinks', () => {
    const text = 'See [[journal:my-article]] for details.';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('journal:my-article');
    expect(links[0].citationType).toBe('section');
  });

  it('extracts wikilinks with heading anchors', () => {
    const text = 'See [[journal:article#heading-one]].';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('journal:article');
    expect(links[0].anchor).toBe('heading-one');
    expect(links[0].citationType).toBe('heading');
  });

  it('extracts wikilinks with block anchors', () => {
    const text = 'See [[journal:article#^important-point]].';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('journal:article');
    expect(links[0].anchor).toBe('^important-point');
    expect(links[0].citationType).toBe('block');
  });

  it('extracts wikilinks with text fragment anchors', () => {
    const text = 'See [[journal:article#:~:text=the map is not]].';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].citationType).toBe('text');
  });

  it('extracts wikilinks with display text', () => {
    const text = 'Read [[journal:article|this great piece]].';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('journal:article');
    // Display text is not captured in WikilinkData
  });

  it('extracts multiple wikilinks', () => {
    const text = 'See [[journal:a]] and [[journal:b]] and [[specimen:c]].';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(3);
    expect(links.map(l => l.target)).toEqual([
      'journal:a',
      'journal:b',
      'specimen:c',
    ]);
  });

  it('returns empty array for no wikilinks', () => {
    const text = 'No wikilinks here.';
    const links = extractWikilinks(text);
    expect(links).toHaveLength(0);
  });

  it('handles empty string', () => {
    expect(extractWikilinks('')).toHaveLength(0);
  });

  it('handles wikilinks with all parts (anchor and display)', () => {
    const text = '[[journal:article#section|custom text]]';
    const links = extractWikilinks(text);

    expect(links).toHaveLength(1);
    expect(links[0].target).toBe('journal:article');
    expect(links[0].anchor).toBe('section');
    expect(links[0].citationType).toBe('heading');
  });
});

describe('extractExternalLinks', () => {
  it('extracts markdown external links', () => {
    const text = 'Check [this site](https://example.com) for info.';
    const links = extractExternalLinks(text);

    expect(links).toHaveLength(1);
    expect(links[0]).toBe('https://example.com');
  });

  it('extracts multiple external links', () => {
    const text = '[Site A](https://a.com) and [Site B](http://b.com).';
    const links = extractExternalLinks(text);

    expect(links).toHaveLength(2);
    expect(links).toContain('https://a.com');
    expect(links).toContain('http://b.com');
  });

  it('extracts links with paths and query strings', () => {
    const text = '[Page](https://example.com/path/to/page?query=value).';
    const links = extractExternalLinks(text);

    expect(links).toHaveLength(1);
    expect(links[0]).toBe('https://example.com/path/to/page?query=value');
  });

  it('returns empty array for no external links', () => {
    const text = 'No links here, just [[journal:wikilinks]].';
    const links = extractExternalLinks(text);
    expect(links).toHaveLength(0);
  });

  it('does not extract wikilinks', () => {
    const text = '[[journal:article]] is not an external link.';
    const links = extractExternalLinks(text);
    expect(links).toHaveLength(0);
  });

  it('handles empty string', () => {
    expect(extractExternalLinks('')).toHaveLength(0);
  });

  it('only extracts http/https URLs', () => {
    const text = '[FTP](ftp://example.com) and [HTTPS](https://example.com).';
    const links = extractExternalLinks(text);

    expect(links).toHaveLength(1);
    expect(links[0]).toBe('https://example.com');
  });
});
