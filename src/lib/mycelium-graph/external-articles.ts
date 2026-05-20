/**
 * External article detection and utilities for the Mycelium graph system.
 *
 * Distinguishes external article URLs (academic papers, major publications,
 * Wikipedia, etc.) from generic external links (music platforms, social media).
 */

/** Domains that typically host article-like content */
const ARTICLE_DOMAINS = [
  // Academic & preprint
  'arxiv.org',
  'doi.org',
  'scholar.google.com',
  'researchgate.net',
  'academia.edu',
  'jstor.org',
  'ncbi.nlm.nih.gov',
  'nber.org',
  'nature.com',
  'science.org',
  'sciencedirect.com',
  'springer.com',
  'wiley.com',
  'plos.org',
  'journals.plos.org',
  'frontiersin.org',
  'mdpi.com',
  'anthropoetics.ucla.edu',
  // Major publications
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'axios.com',
  'theatlantic.com',
  'newyorker.com',
  'wired.com',
  'aeon.co',
  'thecorrespondent.com',
  'theverge.com',
  'longreads.com',
  'lrb.co.uk',
  'ft.com',
  'economist.com',
  'statnews.com',
  'history.com',
  'the-scientist.com',
  'scitechdaily.com',
  // Encyclopedias & references
  'wikipedia.org',
  'en.wikipedia.org',
  'es.wikipedia.org',
  'plato.stanford.edu',
  'britannica.com',
  'nrc.gov',
  'donellameadows.org',
  'signosemio.com',
  'vandvreader.org',
  'rev.com',
  // Blogs & independent writers
  'medium.com',
  'substack.com',
  'ribbonfarm.com',
  'lesswrong.com',
  'slatestarcodex.com',
  'astralcodexten.com',
  'gwern.net',
  // Lancet family
  'thelancet.com',
  // Think tanks & policy
  'csis.org',
  'brookings.edu',
  'rand.org',
  'cfr.org',
];

/** Domains to exclude from article detection (music/video/social) */
const NON_ARTICLE_DOMAINS = [
  'spotify.com',
  'youtube.com',
  'youtu.be',
  'bandcamp.com',
  'soundcloud.com',
  'vimeo.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'facebook.com',
  'linkedin.com',
  'github.com',
];

/**
 * Check if a URL points to an article-like domain.
 */
export function isArticleDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Check exclusions first
    if (NON_ARTICLE_DOMAINS.some(d => hostname.includes(d))) {
      return false;
    }
    // Check inclusions
    return ARTICLE_DOMAINS.some(d => hostname.includes(d));
  } catch {
    return false;
  }
}

/**
 * Extract display-friendly domain from a URL.
 * "https://www.nytimes.com/2024/..." -> "nytimes.com"
 */
export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Remove www. prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return 'external';
  }
}

/**
 * Create a stable ID for an external article node from URL.
 * Uses `e:` prefix to distinguish from exit nodes (`x:`).
 */
export function createExternalArticleId(url: string): string {
  // Simple hash - djb2 algorithm
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) + hash) ^ url.charCodeAt(i);
  }
  return `e${Math.abs(hash).toString(36)}`;
}

/**
 * Extract a likely title from a URL path.
 * "/2024/03/the-future-of-ai" -> "the future of ai"
 */
export function extractTitleFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    // Get last segment that looks like a slug
    const segments = pathname.split('/').filter(Boolean);
    const slug = segments[segments.length - 1];
    if (!slug) return null;
    // Skip if it looks like an ID or date only
    if (/^[\d-]+$/.test(slug)) return null;
    // Convert slug to title
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/\.(html?|php|aspx?)$/i, '')
      .toLowerCase();
  } catch {
    return null;
  }
}
