import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { rehypeBlockAnchors } from './rehype-block-anchors.ts';

/**
 * Process HTML through the block anchors plugin and return transformed HTML.
 */
function process(html: string) {
  return unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeBlockAnchors)
    .use(rehypeStringify)
    .processSync(html)
    .toString();
}

describe('rehypeBlockAnchors', () => {
  describe('paragraph anchors', () => {
    it('adds id to <p> with ^anchor at end', () => {
      const result = process('<p>The map has to be paid for in territory. ^map-territory</p>');
      expect(result).toBe('<p id="map-territory">The map has to be paid for in territory.</p>');
    });

    it('removes ^anchor text from output', () => {
      const result = process('<p>Some text ^my-anchor</p>');
      expect(result).toBe('<p id="my-anchor">Some text</p>');
    });

    it('handles anchor with trailing whitespace', () => {
      const result = process('<p>Text here ^anchor-id   </p>');
      expect(result).toBe('<p id="anchor-id">Text here</p>');
    });

    it('handles anchor with leading whitespace', () => {
      const result = process('<p>Text here   ^anchor-id</p>');
      expect(result).toBe('<p id="anchor-id">Text here</p>');
    });
  });

  describe('blockquote anchors', () => {
    it('adds id to <blockquote> with ^anchor', () => {
      const result = process('<blockquote>A profound quote. ^quote-id</blockquote>');
      expect(result).toBe('<blockquote id="quote-id">A profound quote.</blockquote>');
    });

    it('handles nested paragraph in blockquote', () => {
      // When blockquote contains a <p>, the plugin checks inside nested elements,
      // so the id is added to the blockquote (outer block element)
      const result = process('<blockquote><p>Quote text. ^nested</p></blockquote>');
      expect(result).toBe('<blockquote id="nested"><p>Quote text.</p></blockquote>');
    });
  });

  describe('list item anchors', () => {
    it('adds id to <li> with ^anchor', () => {
      const result = process('<ul><li>First item ^item-1</li><li>Second item</li></ul>');
      expect(result).toBe('<ul><li id="item-1">First item</li><li>Second item</li></ul>');
    });

    it('handles multiple anchored list items', () => {
      const result = process('<ul><li>A ^a</li><li>B ^b</li></ul>');
      expect(result).toBe('<ul><li id="a">A</li><li id="b">B</li></ul>');
    });
  });

  describe('nested element anchors', () => {
    it('finds ^anchor inside <em> at end of paragraph', () => {
      const result = process('<p>Text with <em>emphasis ^anchor-em</em></p>');
      expect(result).toBe('<p id="anchor-em">Text with <em>emphasis</em></p>');
    });

    it('finds ^anchor inside <strong> at end of paragraph', () => {
      const result = process('<p>Text with <strong>bold ^anchor-strong</strong></p>');
      expect(result).toBe('<p id="anchor-strong">Text with <strong>bold</strong></p>');
    });

    it('finds ^anchor inside <code> at end of paragraph', () => {
      const result = process('<p>Text with <code>code ^anchor-code</code></p>');
      expect(result).toBe('<p id="anchor-code">Text with <code>code</code></p>');
    });
  });

  describe('no-op cases', () => {
    it('ignores ^anchor in middle of text', () => {
      const result = process('<p>Text ^middle more text.</p>');
      // Anchor not at end, so no transformation
      expect(result).toBe('<p>Text ^middle more text.</p>');
    });

    it('ignores elements without ^anchor', () => {
      const result = process('<p>Just regular text without anchor.</p>');
      expect(result).toBe('<p>Just regular text without anchor.</p>');
    });

    it('ignores non-block elements (div)', () => {
      const result = process('<div>Content ^anchor-div</div>');
      // div is not in the allowed list (p, blockquote, li)
      expect(result).toBe('<div>Content ^anchor-div</div>');
    });

    it('ignores span elements', () => {
      const result = process('<span>Content ^anchor-span</span>');
      expect(result).toBe('<span>Content ^anchor-span</span>');
    });

    it('ignores headings', () => {
      const result = process('<h2>Heading ^anchor-h2</h2>');
      expect(result).toBe('<h2>Heading ^anchor-h2</h2>');
    });
  });

  describe('anchor id validation', () => {
    it('accepts lowercase letters', () => {
      const result = process('<p>Text ^lowercase</p>');
      expect(result).toBe('<p id="lowercase">Text</p>');
    });

    it('accepts numbers', () => {
      const result = process('<p>Text ^anchor123</p>');
      expect(result).toBe('<p id="anchor123">Text</p>');
    });

    it('accepts hyphens', () => {
      const result = process('<p>Text ^my-anchor-id</p>');
      expect(result).toBe('<p id="my-anchor-id">Text</p>');
    });

    it('pattern is case-insensitive', () => {
      const result = process('<p>Text ^MyAnchor</p>');
      expect(result).toBe('<p id="MyAnchor">Text</p>');
    });

    it('rejects anchors with underscores (no match)', () => {
      // The pattern [a-z0-9-] doesn't include underscores
      const result = process('<p>Text ^my_anchor</p>');
      // No match, so text remains unchanged
      expect(result).toBe('<p>Text ^my_anchor</p>');
    });

    it('rejects anchors with special characters (no match)', () => {
      const result = process('<p>Text ^anchor@id</p>');
      expect(result).toBe('<p>Text ^anchor@id</p>');
    });
  });

  describe('multiple elements', () => {
    it('processes multiple paragraphs independently', () => {
      const result = process('<p>First ^first</p><p>Second ^second</p>');
      expect(result).toBe('<p id="first">First</p><p id="second">Second</p>');
    });

    it('mixed anchored and non-anchored elements', () => {
      const result = process('<p>Has anchor ^a</p><p>No anchor</p><p>Also has ^b</p>');
      expect(result).toBe('<p id="a">Has anchor</p><p>No anchor</p><p id="b">Also has</p>');
    });
  });
});
