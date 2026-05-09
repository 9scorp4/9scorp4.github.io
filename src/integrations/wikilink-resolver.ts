/**
 * wikilink-resolver — Astro integration that builds link resolution maps.
 *
 * Scans content collections and provides resolved paths to the remark-wikilink plugin.
 * Must run before mdx() in the integrations array.
 */

import type { AstroIntegration } from 'astro';
import { remarkWikilink } from '../lib/remark-wikilink.ts';
import { rehypeBlockAnchors } from '../lib/rehype-block-anchors.ts';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

interface WikilinkResolverOptions {
  /**
   * If true, throws on unresolved links during build.
   * Default: true in production, false in development.
   */
  strict?: boolean;
}

/**
 * Scans a content directory and builds a map of slugs to paths.
 */
function buildCollectionMap(
  contentDir: string,
  collectionName: string,
  pathPattern: (slug: string) => string
): Map<string, string> {
  const collectionPath = path.join(contentDir, collectionName);
  const map = new Map<string, string>();

  if (!fs.existsSync(collectionPath)) {
    return map;
  }

  const entries = fs.readdirSync(collectionPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Directory-based entry (like diptychs)
      const slug = entry.name;
      map.set(slug, pathPattern(slug));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      // File-based entry
      const slug = entry.name.replace(/\.(mdx?|yaml)$/, '');
      map.set(slug, pathPattern(slug));
    }
  }

  return map;
}

/**
 * Builds resolution maps for specimens (by id from YAML files).
 */
function buildSpecimenMap(contentDir: string): Map<string, string> {
  const collectionPath = path.join(contentDir, 'specimens');
  const map = new Map<string, string>();

  if (!fs.existsSync(collectionPath)) {
    return map;
  }

  const files = fs.readdirSync(collectionPath).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const filePath = path.join(collectionPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    try {
      const data = parseYaml(content);
      if (data && data.id) {
        // Specimens link to their anchor on the index page
        map.set(data.id, `/#${data.id}`);
      }
    } catch {
      // Skip invalid YAML
    }
  }

  return map;
}

export default function wikilinkResolver(options: WikilinkResolverOptions = {}): AstroIntegration {
  return {
    name: 'wikilink-resolver',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, command }) => {
        const isProduction = command === 'build';
        const strict = options.strict ?? isProduction;

        // Determine content directory
        const rootDir = config.root ? new URL(config.root).pathname : process.cwd();
        const contentDir = path.join(rootDir, 'src', 'content');

        // Build resolution maps for each collection
        const resolvedLinks = new Map<string, Map<string, string>>();

        // Journal entries → /cuaderno/[slug]/
        resolvedLinks.set('journal', buildCollectionMap(
          contentDir,
          'journal',
          (slug) => `/cuaderno/${slug}/`
        ));

        // Specimens → /#[id]
        resolvedLinks.set('specimen', buildSpecimenMap(contentDir));

        // Library authors → /#library-[slug]
        // These are hardcoded for now since they're in code, not content
        const libraryMap = new Map<string, string>();
        const libraryAuthors = [
          'gregory-bateson',
          'stafford-beer',
          'humberto-maturana',
          'gordon-pask',
          'norbert-wiener',
          'heinz-von-foerster',
        ];
        for (const author of libraryAuthors) {
          libraryMap.set(author, `/#library-${author}`);
        }
        resolvedLinks.set('library', libraryMap);

        // Update markdown config with our plugins
        updateConfig({
          markdown: {
            remarkPlugins: [
              [remarkWikilink, { resolvedLinks, strict }],
            ],
            rehypePlugins: [
              rehypeBlockAnchors,
            ],
          },
        });
      },
    },
  };
}
