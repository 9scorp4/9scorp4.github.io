/**
 * QR code generation utilities for Instagram posts.
 * Generates QR codes that link to relevant site content.
 */

import QRCode from 'qrcode';
import type { TemplateType, ContentMetadata, QuoteMetadata, TitleMetadata, SpecimenMetadata, MetalogueMetadata } from './insta-captions.ts';

const DEFAULT_SITE_URL = 'https://9scorp4.github.io';

export interface QROptions {
  /** QR code size in pixels (default: 80) */
  size?: number;
  /** Module color (default: inkFaint #8a7a5f) */
  color?: string;
  /** Background color (default: paper #efe2c2) */
  background?: string;
  /** Error correction level (default: M) */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate a QR code as a data URL (PNG base64).
 * Uses ink color on paper for reliable scanning while maintaining aesthetic.
 * Generated at high resolution (300px) to prevent blur when rendered in Satori.
 * @param url - The URL to encode
 * @param options - QR styling options
 * @returns Data URL string for the QR code image
 */
export async function generateQRDataUrl(
  url: string,
  options: QROptions = {}
): Promise<string> {
  const {
    size = 420, // high res (3x display size) to prevent blur
    color = '#3d2f1a', // ink (high contrast, scannable)
    background = '#efe2c2', // paper
    errorCorrectionLevel = 'H', // highest error correction
  } = options;

  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: background,
    },
    errorCorrectionLevel,
  });
}

/**
 * Extended metadata that includes slug/id for URL generation.
 * The insta-gen.ts script adds these when creating metadata.
 */
export interface ExtendedQuoteMetadata extends QuoteMetadata {
  slug: string;
}

export interface ExtendedTitleMetadata extends TitleMetadata {
  slug: string;
}

export interface ExtendedSpecimenMetadata extends SpecimenMetadata {
  id: string;
}

export interface ExtendedMetalogueMetadata extends MetalogueMetadata {
  slug: string;
}

export type ExtendedContentMetadata =
  | ExtendedQuoteMetadata
  | ExtendedTitleMetadata
  | ExtendedSpecimenMetadata
  | ExtendedMetalogueMetadata
  | ContentMetadata;

/**
 * Compute the in-site URL for a given template type and metadata.
 *
 * URL routing (all sections are anchors on the home page):
 * - quote  → /cuaderno/{slug}
 * - title  → /cuaderno/{slug}
 * - status → /#now
 * - specimen → /#conservatory (individual specimen anchors not implemented)
 * - cultivation → /#cultivations
 *
 * @param templateType - The type of Instagram template
 * @param metadata - Content metadata (must include slug for quote/title)
 * @param baseUrl - Site base URL (defaults to SITE_URL env or production URL)
 * @returns Full URL to the content on the site
 */
export function getContentUrl(
  templateType: TemplateType,
  metadata: ExtendedContentMetadata,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.SITE_URL || DEFAULT_SITE_URL;

  switch (templateType) {
    case 'quote':
    case 'title': {
      const slug = (metadata as ExtendedQuoteMetadata | ExtendedTitleMetadata).slug;
      if (!slug) {
        console.warn(`No slug provided for ${templateType} template, defaulting to /#journal`);
        return `${base}/#journal`;
      }
      return `${base}/cuaderno/${slug}`;
    }

    case 'status':
      return `${base}/#now`;

    case 'specimen': {
      const id = (metadata as ExtendedSpecimenMetadata).id;
      if (!id) {
        console.warn('No id provided for specimen template, defaulting to /#conservatory');
        return `${base}/#conservatory`;
      }
      return `${base}/#${id}`;
    }

    case 'metalogue': {
      const slug = (metadata as ExtendedMetalogueMetadata).slug;
      if (!slug) {
        console.warn('No slug provided for metalogue template, defaulting to /#journal');
        return `${base}/#journal`;
      }
      return `${base}/cuaderno/${slug}#metalogue`;
    }

    default:
      return base;
  }
}
