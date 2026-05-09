/**
 * rehype-block-anchors — adds id attributes to elements with ^anchor syntax.
 *
 * Syntax in markdown:
 *   The map has to be paid for in territory. ^map-territory
 *
 * Renders as:
 *   <p id="map-territory">The map has to be paid for in territory.</p>
 *
 * Works with paragraphs, blockquotes, and list items.
 */

import type { Root, Element, Text } from 'hast';
import { visit } from 'unist-util-visit';

// Pattern: ^anchor-id at end of text, with optional trailing whitespace
const BLOCK_ANCHOR_PATTERN = /\s*\^([a-z0-9-]+)\s*$/i;

export function rehypeBlockAnchors() {
  return function transformer(tree: Root) {
    visit(tree, 'element', (node: Element) => {
      // Only process block-level elements
      if (!['p', 'blockquote', 'li'].includes(node.tagName)) return;

      // Find the last text node in this element
      const lastChild = node.children[node.children.length - 1];

      if (lastChild?.type === 'text') {
        const textNode = lastChild as Text;
        const match = textNode.value.match(BLOCK_ANCHOR_PATTERN);

        if (match) {
          const anchorId = match[1];

          // Remove the anchor syntax from the text
          textNode.value = textNode.value.replace(BLOCK_ANCHOR_PATTERN, '');

          // Add the id to the element
          node.properties = node.properties || {};
          node.properties.id = anchorId;
        }
      }

      // Also check if the last child is an element (e.g., <em>, <strong>)
      // and the anchor is inside it
      if (lastChild?.type === 'element') {
        const lastElement = lastChild as Element;
        const innerLastChild = lastElement.children[lastElement.children.length - 1];

        if (innerLastChild?.type === 'text') {
          const textNode = innerLastChild as Text;
          const match = textNode.value.match(BLOCK_ANCHOR_PATTERN);

          if (match) {
            const anchorId = match[1];
            textNode.value = textNode.value.replace(BLOCK_ANCHOR_PATTERN, '');
            node.properties = node.properties || {};
            node.properties.id = anchorId;
          }
        }
      }
    });
  };
}

export default rehypeBlockAnchors;
