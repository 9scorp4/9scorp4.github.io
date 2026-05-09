/**
 * remark-wikilink — transforms [[collection:slug]] syntax to standard links.
 *
 * Syntax:
 *   [[journal:slug]]                    → /cuaderno/slug/
 *   [[journal:slug#heading-id]]         → /cuaderno/slug/#heading-id
 *   [[journal:slug#^anchor]]            → /cuaderno/slug/#anchor
 *   [[journal:slug#^anchor|text]]       → /cuaderno/slug/#anchor (with custom display text)
 *   [[journal:slug#:~:text=phrase]]     → /cuaderno/slug/#:~:text=phrase
 *   [[specimen:id]]                     → /#id
 *   [[library:name]]                    → /#library-name
 */

import type { Root, Text, Link, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';

export interface WikilinkOptions {
  /**
   * Map of collection → (slug → resolved path)
   * Example: { journal: Map([['smash-laterally-i', '/cuaderno/smash-laterally-i/']]) }
   */
  resolvedLinks?: Map<string, Map<string, string>>;

  /**
   * If true, throws on unresolved links (for CI validation).
   * If false, emits warning and leaves text unchanged.
   */
  strict?: boolean;
}

// Pattern: [[collection:slug]] or [[collection:slug#fragment]] or [[collection:slug#fragment|display]]
const WIKILINK_PATTERN = /\[\[(\w+):([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

export function remarkWikilink(options: WikilinkOptions = {}) {
  const { resolvedLinks = new Map(), strict = false } = options;

  return function transformer(tree: Root) {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const matches = [...text.matchAll(WIKILINK_PATTERN)];

      if (matches.length === 0) return;

      // Build new nodes to replace this text node
      const newNodes: PhrasingContent[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const [fullMatch, collection, slug, fragment, displayText] = match;
        const matchStart = match.index!;

        // Add text before this match
        if (matchStart > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, matchStart),
          });
        }

        // Resolve the link
        const collectionMap = resolvedLinks.get(collection);
        const basePath = collectionMap?.get(slug);

        if (basePath) {
          // Build the full URL with optional fragment
          let url = basePath;
          if (fragment) {
            // Handle ^anchor syntax - strip the ^ prefix
            const cleanFragment = fragment.startsWith('^') ? fragment.slice(1) : fragment;
            url += `#${cleanFragment}`;
          }

          // Create link node with custom display text or default to slug
          const linkNode: Link = {
            type: 'link',
            url,
            children: [{ type: 'text', value: displayText || slug }],
          };
          newNodes.push(linkNode);
        } else {
          // Unresolved link
          const message = `Unresolved wikilink: [[${collection}:${slug}]]`;
          if (strict) {
            throw new Error(message);
          } else {
            console.warn(`[remark-wikilink] ${message}`);
            // Leave the text unchanged
            newNodes.push({
              type: 'text',
              value: fullMatch,
            });
          }
        }

        lastIndex = matchStart + fullMatch.length;
      }

      // Add remaining text after last match
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      // Replace the original text node with our new nodes
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

export default remarkWikilink;
