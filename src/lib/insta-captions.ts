/**
 * Instagram caption templates and hashtag suggestions.
 * Generates default captions based on content type and metadata.
 */

export type TemplateType = 'quote' | 'title' | 'status' | 'specimen' | 'intro' | 'metalogue';

export interface QuoteMetadata {
  quote: string;
  sourceTitle: string;
  date: Date;
}

export interface TitleMetadata {
  title: string;
  titleSecondary?: string;
  date: Date;
  isDiptych?: boolean;
}

export interface StatusMetadata {
  date: Date;
  temperatura?: string;
  escuchando?: string;
  cultivando?: string;
}

export interface SpecimenMetadata {
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  description: string;
  series?: string;
}

export interface IntroMetadata {
  slideCount: number;
}

export interface MetalogueMetadata {
  fragments: Array<{ speaker: string; line: string }>;
  sourceTitle: string;
  metalogueTitle?: string;
  date: Date;
  slug: string;
}

export type ContentMetadata = QuoteMetadata | TitleMetadata | StatusMetadata | SpecimenMetadata | IntroMetadata | MetalogueMetadata;

export interface GeneratedCaption {
  caption: string;
  hashtags: string;
}

/**
 * Format a date in Spanish for captions.
 */
function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generate a default caption for quote cards.
 */
function generateQuoteCaption(meta: QuoteMetadata): string {
  // Truncate quote for caption if very long
  const maxQuoteLength = 200;
  const truncatedQuote =
    meta.quote.length > maxQuoteLength
      ? meta.quote.slice(0, maxQuoteLength).trim() + '...'
      : meta.quote;

  return `"${truncatedQuote}"\n\n— ${meta.sourceTitle}`;
}

/**
 * Generate a default caption for title cards.
 */
function generateTitleCaption(meta: TitleMetadata): string {
  const diptychMarker = meta.isDiptych ? ' [diptych]' : '';
  const secondary = meta.titleSecondary ? `\n${meta.titleSecondary}` : '';
  return `nuevo en el jardín: ${meta.title}${secondary}${diptychMarker}`;
}

/**
 * Generate a default caption for status updates.
 */
function generateStatusCaption(meta: StatusMetadata): string {
  return `el ahora · ${formatDateEs(meta.date)}`;
}

/**
 * Generate a default caption for specimen cards.
 */
function generateSpecimenCaption(meta: SpecimenMetadata): string {
  const statusLabel: Record<string, string> = {
    growing: 'creciendo',
    dormant: 'dormant',
    wild: 'silvestre',
    composted: 'compostado',
  };
  return `${meta.name} [${statusLabel[meta.status]}]`;
}

/**
 * Generate a default caption for intro carousel.
 */
function generateIntroCaption(): string {
  return `el jardin cibernetico: a garden that documents itself

swipe for a tour of the sections, the secrets, and the strange corners.

link in bio`;
}

/**
 * Generate a default caption for metalogue cards.
 */
function generateMetalogueCaption(meta: MetalogueMetadata): string {
  const title = meta.metalogueTitle || meta.sourceTitle;
  const fragmentPreview = meta.fragments.slice(0, 2)
    .map(f => `${f.speaker}: ${f.line}`)
    .join('\n');

  return `metálogo de "${title}"

${fragmentPreview}

— after Bateson's metalogues`;
}

/**
 * Generate default hashtags based on content type.
 */
function generateHashtags(type: TemplateType, meta: ContentMetadata): string {
  const base = ['#cuadernodecampo', '#fieldjournal', '#carnetdeterrain'];

  const typeSpecific: Record<TemplateType, string[]> = {
    quote: ['#escritura', '#writing', '#ecriture', '#fragmentos'],
    title: ['#nuevopost', '#newpost', '#jardincibernetico'],
    status: ['#elahora', '#thenow', '#maintenant'],
    specimen: ['#creativecoding', '#generativeart', '#p5js'],
    intro: ['#jardincibernetico', '#cyberneticgarden', '#personalsite', '#webdesign'],
    metalogue: ['#metalogo', '#dialogue', '#batesonian', '#conversationtheory'],
  };

  const tags = [...base, ...typeSpecific[type]];

  // Add content-specific tags
  if (type === 'specimen') {
    const specMeta = meta as SpecimenMetadata;
    if (specMeta.series) {
      tags.push(`#${specMeta.series.toLowerCase().replace(/\s+/g, '')}`);
    }
  }

  return tags.join(' ');
}

/**
 * Generate caption and hashtags for a given content type.
 */
export function generateCaption(type: TemplateType, meta: ContentMetadata): GeneratedCaption {
  let caption: string;

  switch (type) {
    case 'quote':
      caption = generateQuoteCaption(meta as QuoteMetadata);
      break;
    case 'title':
      caption = generateTitleCaption(meta as TitleMetadata);
      break;
    case 'status':
      caption = generateStatusCaption(meta as StatusMetadata);
      break;
    case 'specimen':
      caption = generateSpecimenCaption(meta as SpecimenMetadata);
      break;
    case 'intro':
      caption = generateIntroCaption();
      break;
    case 'metalogue':
      caption = generateMetalogueCaption(meta as MetalogueMetadata);
      break;
  }

  return {
    caption,
    hashtags: generateHashtags(type, meta),
  };
}

/**
 * Metadata structure for saving alongside generated images.
 */
export interface SavedPostMetadata {
  templateType: TemplateType;
  generatedAt: string;
  caption?: string;
  hashtags?: string;
  published?: boolean;
  publishedAt?: string;
  bufferId?: string;
  metadata: ContentMetadata;
}

/**
 * Create metadata object for saving alongside image.
 */
export function createPostMetadata(
  type: TemplateType,
  meta: ContentMetadata,
  caption?: string,
  hashtags?: string
): SavedPostMetadata {
  return {
    templateType: type,
    generatedAt: new Date().toISOString(),
    caption,
    hashtags,
    metadata: meta,
  };
}
