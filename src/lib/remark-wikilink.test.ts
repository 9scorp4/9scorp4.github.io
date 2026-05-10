import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkWikilink, type WikilinkOptions } from './remark-wikilink.ts';

/**
 * Process markdown through the wikilink plugin and return HTML.
 * Using remark-rehype + rehype-stringify gives us HTML output,
 * which makes assertions clearer for link elements.
 */
function process(md: string, options: WikilinkOptions = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkWikilink, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString();
}

// Standard resolved links for testing
function createResolvedLinks() {
  const journal = new Map([
    ['my-article', '/cuaderno/my-article/'],
    ['smash-laterally-i', '/cuaderno/smash-laterally-i/'],
    ['other-entry', '/cuaderno/other-entry/'],
  ]);
  const specimen = new Map([
    ['particle-flow', '/#particle-flow'],
    ['garden-growth', '/#garden-growth'],
  ]);
  const library = new Map([
    ['references', '/#library-references'],
    ['reading-list', '/#library-reading-list'],
  ]);
  return new Map([
    ['journal', journal],
    ['specimen', specimen],
    ['library', library],
  ]);
}

describe('remarkWikilink', () => {
  describe('basic transformations', () => {
    it('transforms [[journal:slug]] to /cuaderno/slug/ link', () => {
      const result = process('See [[journal:my-article]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p>See <a href="/cuaderno/my-article/">my-article</a>.</p>');
    });

    it('transforms [[specimen:id]] to /#id link', () => {
      const result = process('Check [[specimen:particle-flow]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p>Check <a href="/#particle-flow">particle-flow</a>.</p>');
    });

    it('transforms [[library:name]] to /#library-name link', () => {
      const result = process('See the [[library:references]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p>See the <a href="/#library-references">references</a>.</p>');
    });
  });

  describe('fragment handling', () => {
    it('preserves #heading-id fragments', () => {
      const result = process('Jump to [[journal:my-article#section-one]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p>Jump to <a href="/cuaderno/my-article/#section-one">my-article</a>.</p>'
      );
    });

    it('strips ^ from ^anchor syntax (^foo → #foo)', () => {
      const result = process('See [[journal:my-article#^important-point]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p>See <a href="/cuaderno/my-article/#important-point">my-article</a>.</p>'
      );
    });

    it('preserves :~:text= fragments unchanged', () => {
      const result = process('Read [[journal:my-article#:~:text=key phrase]].', {
        resolvedLinks: createResolvedLinks(),
      });
      // Spaces are URL-encoded by the HTML serializer
      expect(result).toBe(
        '<p>Read <a href="/cuaderno/my-article/#:~:text=key%20phrase">my-article</a>.</p>'
      );
    });
  });

  describe('display text', () => {
    it('uses slug as default link text', () => {
      const result = process('[[journal:my-article]]', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p><a href="/cuaderno/my-article/">my-article</a></p>');
    });

    it('uses custom display text when provided via |text', () => {
      const result = process('Read [[journal:my-article|this great piece]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p>Read <a href="/cuaderno/my-article/">this great piece</a>.</p>'
      );
    });

    it('uses custom display text with fragments', () => {
      const result = process('See [[journal:my-article#^anchor|the key insight]].', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p>See <a href="/cuaderno/my-article/#anchor">the key insight</a>.</p>'
      );
    });
  });

  describe('multiple wikilinks', () => {
    it('transforms multiple wikilinks in same paragraph', () => {
      const result = process(
        'First [[journal:my-article]], then [[journal:other-entry]].',
        { resolvedLinks: createResolvedLinks() }
      );
      expect(result).toBe(
        '<p>First <a href="/cuaderno/my-article/">my-article</a>, then <a href="/cuaderno/other-entry/">other-entry</a>.</p>'
      );
    });

    it('transforms wikilinks across different collections', () => {
      const result = process(
        'See [[journal:my-article]] and [[specimen:particle-flow]].',
        { resolvedLinks: createResolvedLinks() }
      );
      expect(result).toBe(
        '<p>See <a href="/cuaderno/my-article/">my-article</a> and <a href="/#particle-flow">particle-flow</a>.</p>'
      );
    });
  });

  describe('unresolved links', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('leaves text unchanged in non-strict mode + warns', () => {
      const result = process('See [[journal:nonexistent]].', {
        resolvedLinks: createResolvedLinks(),
        strict: false,
      });
      expect(result).toBe('<p>See [[journal:nonexistent]].</p>');
      expect(warnSpy).toHaveBeenCalledWith(
        '[remark-wikilink] Unresolved wikilink: [[journal:nonexistent]]'
      );
    });

    it('throws Error in strict mode', () => {
      expect(() => {
        process('See [[journal:nonexistent]].', {
          resolvedLinks: createResolvedLinks(),
          strict: true,
        });
      }).toThrow('Unresolved wikilink: [[journal:nonexistent]]');
    });

    it('handles unknown collection in non-strict mode', () => {
      const result = process('See [[unknown:something]].', {
        resolvedLinks: createResolvedLinks(),
        strict: false,
      });
      expect(result).toBe('<p>See [[unknown:something]].</p>');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('preserves surrounding text', () => {
      const result = process('Before [[journal:my-article]] after.', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p>Before <a href="/cuaderno/my-article/">my-article</a> after.</p>'
      );
    });

    it('handles wikilink at start of text', () => {
      const result = process('[[journal:my-article]] is great.', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe(
        '<p><a href="/cuaderno/my-article/">my-article</a> is great.</p>'
      );
    });

    it('handles wikilink at end of text', () => {
      const result = process('Read [[journal:my-article]]', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p>Read <a href="/cuaderno/my-article/">my-article</a></p>');
    });

    it('handles text without wikilinks', () => {
      const result = process('Just regular text.', {
        resolvedLinks: createResolvedLinks(),
      });
      expect(result).toBe('<p>Just regular text.</p>');
    });

    it('handles empty resolvedLinks map', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = process('See [[journal:my-article]].', {
        resolvedLinks: new Map(),
        strict: false,
      });
      expect(result).toBe('<p>See [[journal:my-article]].</p>');
      warnSpy.mockRestore();
    });
  });
});
