import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt();

/**
 * Transform wikilink syntax to standard markdown links for RSS.
 * Supports: [[collection:slug]], [[collection:slug#fragment]], [[collection:slug#fragment|display]]
 * Non-strict mode: just removes unresolved wikilinks.
 */
function transformWikilinks(content: string): string {
  // Pattern: [[collection:slug]] or [[collection:slug#fragment]] or [[collection:slug#fragment|display]]
  const pattern = /\[\[(\w+):([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  return content.replace(pattern, (match, collection, slug, fragment, displayText) => {
    let path: string;

    switch (collection) {
      case 'journal':
        path = `/cuaderno/${slug}/`;
        break;
      case 'specimen':
        path = `/#${slug}`;
        break;
      case 'library':
        path = `/#library-${slug}`;
        break;
      default:
        // Unknown collection, leave as plain text
        console.warn(`[feed.xml] Unknown wikilink collection: ${collection}`);
        return displayText || slug;
    }

    if (fragment) {
      const cleanFragment = fragment.startsWith('^') ? fragment.slice(1) : fragment;
      path += `#${cleanFragment}`;
    }

    return `[${displayText || slug}](${path})`;
  });
}

/**
 * Strip ^anchor syntax from content (these don't render in RSS).
 */
function stripBlockAnchors(content: string): string {
  return content.replace(/\s*\^[a-z0-9-]+\s*$/gim, '');
}

// French month names for ahora titles
const frenchMonths = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function formatAhoraDate(date: Date): string {
  const day = date.getUTCDate();
  const month = frenchMonths[date.getUTCMonth()];
  return `${day} ${month}`;
}

export async function GET(context: APIContext) {
  const journal = await getCollection('journal', ({ data }) => !data.draft);
  const ahora = await getCollection('ahora');

  // Pre-load diptych markdown (raw content)
  const articleModules = import.meta.glob<{ rawContent: () => string }>(
    '/src/content/journal/**/_article.md',
    { eager: true }
  );
  const metalogueModules = import.meta.glob<{ rawContent: () => string }>(
    '/src/content/journal/**/_metalogue.md',
    { eager: true }
  );

  // Build unified feed items
  type FeedItem = {
    title: string;
    pubDate: Date;
    description: string;
    link: string;
    content: string;
  };

  const journalItems: FeedItem[] = journal.map((entry) => {
    let rawContent: string;

    if (entry.data.type === 'diptych') {
      const articlePath = `/src/content/journal/${entry.slug}/_article.md`;
      const metaloguePath = `/src/content/journal/${entry.slug}/_metalogue.md`;
      const article = articleModules[articlePath]?.rawContent?.() ?? '';
      const metalogue = metalogueModules[metaloguePath]?.rawContent?.() ?? '';
      rawContent = article + '\n\n---\n\n## metalogue\n\n' + metalogue;
    } else {
      rawContent = entry.body ?? '';
    }

    // Transform wikilinks and strip anchors for RSS
    const processedContent = stripBlockAnchors(transformWikilinks(rawContent));

    return {
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link: `/cuaderno/${entry.slug}/`,
      content: sanitizeHtml(md.render(processedContent), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    };
  });

  const ahoraItems: FeedItem[] = ahora.map((entry) => ({
    title: `ahora · ${formatAhoraDate(entry.data.date)}`,
    pubDate: entry.data.date,
    description: 'dispatch from the now',
    link: '/#now',
    content: sanitizeHtml(md.render(entry.body ?? ''), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    }),
  }));

  // Ahora first in spread so it wins ties (same-day entries)
  const allItems = [...ahoraItems, ...journalItems]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'un jardín cibernético',
    description: 'field notes from a cybernetic garden',
    site: context.site ?? 'https://9scorp4.github.io',
    items: allItems,
  });
}
