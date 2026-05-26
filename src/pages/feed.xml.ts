import rss from '@astrojs/rss';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { extractSlug } from '../lib/journal-slug.ts';

type AhoraLookups = {
  journal: Map<string, CollectionEntry<'journal'>>;
  specimens: Map<string, CollectionEntry<'specimens'>>;
  cultivations: Map<string, CollectionEntry<'cultivations'>>;
  slugToFolder: Map<string, string>;
};

const md = new MarkdownIt();

/**
 * Transform wikilink syntax to standard markdown links for RSS.
 * Supports: [[collection:slug]], [[collection:slug#fragment]], [[collection:slug#fragment|display]]
 * Non-strict mode: just removes unresolved wikilinks.
 *
 * @param slugToFolder - Map from clean slugs to folder names (for numeric prefix resolution)
 */
function transformWikilinks(content: string, slugToFolder: Map<string, string>): string {
  // Pattern: [[collection:slug]] or [[collection:slug#fragment]] or [[collection:slug#fragment|display]]
  const pattern = /\[\[(\w+):([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  return content.replace(pattern, (match, collection, slug, fragment, displayText) => {
    let path: string;

    switch (collection) {
      case 'journal': {
        const folderName = slugToFolder.get(slug) ?? slug;
        path = `/cuaderno/${folderName}/`;
        break;
      }
      case 'specimen':
        path = `/#${slug}`;
        break;
      case 'cultivation':
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

/**
 * Build rich content for ahora dispatch by combining prose body with structured frontmatter.
 */
function buildAhoraContent(entry: CollectionEntry<'ahora'>, lookups: AhoraLookups): string {
  const parts: string[] = [];

  // Prose body first
  if (entry.body) {
    parts.push(entry.body);
  }

  // Music tracks
  if (entry.data.escuchando?.length) {
    const tracks = entry.data.escuchando
      .map((t) => `[${t.artist} — ${t.title}](${t.url})`)
      .join(', ');
    parts.push(`*escuchando:* ${tracks}`);
  }

  // Article announcements
  for (const item of entry.data.articuloNuevo ?? []) {
    const journalEntry = lookups.journal.get(item.article);
    if (journalEntry) {
      const folderName = lookups.slugToFolder.get(item.article) ?? item.article;
      const note = item.note ? ` — ${item.note}` : '';
      parts.push(`*artículo nuevo:* [${journalEntry.data.title}](/cuaderno/${folderName}/)${note}`);
    }
  }

  // Specimen announcements
  for (const item of entry.data.specimenNuevo ?? []) {
    const specimen = lookups.specimens.get(item.specimen);
    if (specimen) {
      const note = item.note ? ` — ${item.note}` : '';
      parts.push(`*specimen nuevo:* [${specimen.data.name}](/#conservatorio)${note}`);
    }
  }

  // Cultivation updates
  for (const item of entry.data.cultivando ?? []) {
    const cultivation = lookups.cultivations.get(item.cultivation);
    if (cultivation) {
      const note = item.note ? ` — ${item.note}` : '';
      parts.push(`*cultivando:* [${cultivation.data.name}](/#cultivos)${note}`);
    }
  }

  return parts.join('\n\n');
}

export async function GET(context: APIContext) {
  const journal = await getCollection('journal', ({ data }) => !data.draft);
  const ahora = await getCollection('ahora');
  const specimens = await getCollection('specimens');
  const cultivations = await getCollection('cultivations');

  // Helper to extract folder name from entry id (Astro v6: "01_lo-que-cruza/index" → "01_lo-que-cruza")
  const getFolderName = (e: { id: string }) => e.id.replace(/\/index$/, '');

  // Build slug-to-folder lookup for wikilink resolution (e.g., "lo-que-cruza" → "01_lo-que-cruza")
  const slugToFolder = new Map(journal.map((e) => {
    const folderName = getFolderName(e);
    const slug = extractSlug(folderName);
    return [slug, folderName];
  }));

  // Lookup maps for ahora content enrichment (keyed by clean slug)
  const journalBySlug = new Map(journal.map((e) => [extractSlug(getFolderName(e)), e]));
  const specimensById = new Map(specimens.map((s) => [s.data.id, s]));
  const cultivationsBySlug = new Map(cultivations.map((c) => [c.data.slug, c]));

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
    const folderName = getFolderName(entry);
    let rawContent: string;

    if (entry.data.type === 'diptych') {
      const articlePath = `/src/content/journal/${folderName}/_article.md`;
      const metaloguePath = `/src/content/journal/${folderName}/_metalogue.md`;
      const article = articleModules[articlePath]?.rawContent?.() ?? '';
      const metalogue = metalogueModules[metaloguePath]?.rawContent?.() ?? '';
      rawContent = article + '\n\n---\n\n## metalogue\n\n' + metalogue;
    } else {
      rawContent = entry.body ?? '';
    }

    // Transform wikilinks and strip anchors for RSS
    const processedContent = stripBlockAnchors(transformWikilinks(rawContent, slugToFolder));

    return {
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link: `/cuaderno/${folderName}/`,
      content: sanitizeHtml(md.render(processedContent), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    };
  });

  const lookups: AhoraLookups = {
    journal: journalBySlug,
    specimens: specimensById,
    cultivations: cultivationsBySlug,
    slugToFolder,
  };

  const ahoraItems: FeedItem[] = ahora.map((entry) => ({
    title: `ahora · ${formatAhoraDate(entry.data.date)}`,
    pubDate: entry.data.date,
    description: 'dispatch from the now',
    link: '/#now',
    content: sanitizeHtml(md.render(buildAhoraContent(entry, lookups)), {
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
