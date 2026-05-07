import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  extractBody,
  extractParagraphs,
  truncate,
  formatDate,
  slugify,
} from './insta-gen.ts';

describe('parseFrontmatter', () => {
  it('parses valid YAML frontmatter', () => {
    const content = `---
title: Hello World
date: 2026-05-07
---
Body content here.`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({ title: 'Hello World', date: '2026-05-07' });
  });

  it('returns empty object when no frontmatter', () => {
    const content = 'Just some content without frontmatter.';
    const result = parseFrontmatter(content);
    expect(result).toEqual({});
  });

  it('returns empty object for empty frontmatter block', () => {
    // Pattern requires content between --- delimiters, so empty block doesn't match
    const content = `---
---
Body content here.`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({});
  });
});

describe('extractBody', () => {
  it('extracts body after frontmatter', () => {
    const content = `---
title: Test
---
This is the body.

With multiple paragraphs.`;
    const result = extractBody(content);
    expect(result).toBe('This is the body.\n\nWith multiple paragraphs.');
  });

  it('returns empty string when no frontmatter delimiter found', () => {
    const content = 'Just content without frontmatter.';
    const result = extractBody(content);
    expect(result).toBe('');
  });

  it('trims whitespace from body', () => {
    const content = `---
title: Test
---

   Body with leading whitespace.

`;
    const result = extractBody(content);
    expect(result).toBe('Body with leading whitespace.');
  });
});

describe('extractParagraphs', () => {
  it('splits on double newlines', () => {
    const body = `First paragraph that is long enough to pass the filter.

Second paragraph that is also long enough to pass the filter.`;
    const result = extractParagraphs(body);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('First paragraph that is long enough to pass the filter.');
    expect(result[1]).toBe('Second paragraph that is also long enough to pass the filter.');
  });

  it('filters out short paragraphs', () => {
    const body = `Short.

This is a longer paragraph that should pass the minimum length filter.`;
    const result = extractParagraphs(body);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('longer paragraph');
  });

  it('filters out headings', () => {
    const body = `# This is a heading that is long enough

This is a normal paragraph that should be included in the results.`;
    const result = extractParagraphs(body);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('normal paragraph');
  });

  it('filters out horizontal rules', () => {
    const body = `---

This is a paragraph that should be included in the final results list.`;
    const result = extractParagraphs(body);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('should be included');
  });

  it('joins single newlines into spaces', () => {
    const body = `This is a paragraph
that spans multiple lines
but should be joined together as one paragraph for quotes.`;
    const result = extractParagraphs(body);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(
      'This is a paragraph that spans multiple lines but should be joined together as one paragraph for quotes.'
    );
  });
});

describe('truncate', () => {
  it('returns string unchanged when under limit', () => {
    const result = truncate('short', 10);
    expect(result).toBe('short');
  });

  it('returns string unchanged when at limit', () => {
    const result = truncate('exactly10!', 10);
    expect(result).toBe('exactly10!');
  });

  it('truncates and adds ellipsis when over limit', () => {
    const result = truncate('this is a long string', 10);
    expect(result).toBe('this is...');
    expect(result.length).toBe(10);
  });
});

describe('formatDate', () => {
  it('formats date in en-US locale', () => {
    // Use explicit year/month/day to avoid timezone issues
    const date = new Date(2026, 4, 7); // May is month 4 (0-indexed)
    const result = formatDate(date);
    expect(result).toBe('May 7, 2026');
  });

  it('handles different months', () => {
    const date = new Date(2026, 0, 15); // January is month 0
    const result = formatDate(date);
    expect(result).toBe('Jan 15, 2026');
  });
});

describe('slugify', () => {
  it('lowercases the string', () => {
    const result = slugify('HELLO');
    expect(result).toBe('hello');
  });

  it('replaces special characters with hyphens', () => {
    const result = slugify('hello world!');
    expect(result).toBe('hello-world');
  });

  it('replaces multiple special chars with single hyphen', () => {
    const result = slugify('hello   world');
    expect(result).toBe('hello-world');
  });

  it('removes leading hyphens', () => {
    const result = slugify('---hello');
    expect(result).toBe('hello');
  });

  it('removes trailing hyphens', () => {
    const result = slugify('hello---');
    expect(result).toBe('hello');
  });

  it('handles complex strings', () => {
    const result = slugify('  Hello, World! How are you?  ');
    expect(result).toBe('hello-world-how-are-you');
  });
});
