/**
 * Batch card generation logic for Instagram.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  loadFonts,
  generatePng,
} from '../../src/lib/shared-image-utils.ts';
import {
  QuoteTemplate,
  TitleTemplate,
  StatusTemplate,
  MetalogueTemplate,
  INSTA_DIMENSIONS,
  type InstaFormat,
} from '../../src/lib/insta-templates.tsx';
import type { MetalogueFragment } from '../../src/lib/insta-templates.tsx';
import {
  generateQRDataUrl,
  getContentUrl,
} from '../../src/lib/qr-utils.ts';
import type {
  TemplateType,
  StatusMetadata,
  TitleMetadata,
  QuoteMetadata,
  MetalogueMetadata,
} from '../../src/lib/insta-captions.ts';
import { success } from './cli-style.ts';
import { getOutputDir } from './cli-utils.ts';
import type { JournalEntry, AhoraEntry } from './content-loaders.ts';

const OUTPUT_DIR = getOutputDir();
const FORMAT: InstaFormat = 'square';
const dimensions = INSTA_DIMENSIONS[FORMAT];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Resolved batch ready for generation */
export interface ResolvedBatch {
  slug?: string;
  journal?: JournalEntry;
  ahora?: AhoraEntry;
  quotes?: string[];
  metalogue?: Array<{ speaker: string; line: string }>;
  batchType: 'full' | 'status-only';
}

/** Generated image info */
export interface GeneratedImage {
  path: string;
  filename: string;
  type: TemplateType;
  metadata: StatusMetadata | TitleMetadata | QuoteMetadata | MetalogueMetadata;
  isCarouselPart?: boolean;
  carouselIndex?: number;
  carouselTotal?: number;
}

/** Post ready for publishing */
export interface PostToPublish {
  type: 'single' | 'carousel';
  templateType: TemplateType;
  images: GeneratedImage[];
  metadata: StatusMetadata | TitleMetadata | QuoteMetadata | MetalogueMetadata;
  batchIdx: number;
  postIdx: number;
}

// ─────────────────────────────────────────────────────────────
// Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate all cards for a single batch.
 */
export async function generateBatch(
  batch: ResolvedBatch,
  batchIdx: number,
  fonts: Awaited<ReturnType<typeof loadFonts>>,
  postsToPublish: PostToPublish[]
): Promise<number> {
  let totalCards = 0;
  let postIdxInBatch = 0;
  const batchNum = batchIdx + 1;

  // 1. Status card (if ahora exists)
  if (batch.ahora) {
    const statusMeta: StatusMetadata = {
      date: batch.ahora.date,
      temperatura: batch.ahora.temperatura,
      escuchando: batch.ahora.escuchando,
      cultivando: batch.ahora.cultivando,
    };
    const statusQrUrl = await generateQRDataUrl(getContentUrl('status', statusMeta));
    const statusElement = StatusTemplate({
      ...statusMeta,
      format: FORMAT,
      qrDataUrl: statusQrUrl,
    });
    const statusFilename = `batch${batchNum}-01-status-${batch.ahora.dateStr}.png`;
    const statusPath = join(OUTPUT_DIR, statusFilename);
    const statusPng = await generatePng(statusElement, fonts, dimensions);
    await writeFile(statusPath, statusPng);
    success(`[1] ${statusFilename}`);
    totalCards++;

    postsToPublish.push({
      type: 'single',
      templateType: 'status',
      images: [{ path: statusPath, filename: statusFilename, type: 'status', metadata: statusMeta }],
      metadata: statusMeta,
      batchIdx,
      postIdx: postIdxInBatch++,
    });
  }

  // 2. Title card (if journal exists)
  if (batch.journal) {
    const titleMeta: TitleMetadata & { slug: string; folderName: string } = {
      title: batch.journal.title,
      titleSecondary: batch.journal.titleSecondary,
      date: batch.journal.date,
      isDiptych: batch.journal.type === 'diptych',
      slug: batch.journal.slug,
      folderName: batch.journal.folderName,
    };
    const titleQrUrl = await generateQRDataUrl(getContentUrl('title', titleMeta));
    const titleElement = TitleTemplate({
      title: batch.journal.title,
      titleSecondary: batch.journal.titleSecondary,
      date: batch.journal.date,
      isDiptych: batch.journal.type === 'diptych',
      format: FORMAT,
      qrDataUrl: titleQrUrl,
    });
    const titleFilename = `batch${batchNum}-02-title-${batch.journal.slug}.png`;
    const titlePath = join(OUTPUT_DIR, titleFilename);
    const titlePng = await generatePng(titleElement, fonts, dimensions);
    await writeFile(titlePath, titlePng);
    success(`[2] ${titleFilename}`);
    totalCards++;

    postsToPublish.push({
      type: 'single',
      templateType: 'title',
      images: [{ path: titlePath, filename: titleFilename, type: 'title', metadata: titleMeta }],
      metadata: titleMeta,
      batchIdx,
      postIdx: postIdxInBatch++,
    });

    // 3. Quote carousel (if quotes exist)
    if (batch.quotes && batch.quotes.length > 0) {
      const quoteMeta: QuoteMetadata & { slug: string; folderName: string } = {
        quote: batch.quotes.join(' '),
        sourceTitle: batch.journal.title,
        date: batch.journal.date,
        slug: batch.journal.slug,
        folderName: batch.journal.folderName,
      };
      const quoteQrUrl = await generateQRDataUrl(getContentUrl('quote', quoteMeta));
      const carouselImages: GeneratedImage[] = [];

      for (let i = 0; i < batch.quotes.length; i++) {
        const isLast = i === batch.quotes.length - 1;
        const quoteElement = QuoteTemplate({
          quote: batch.quotes[i],
          sourceTitle: batch.journal.title,
          date: batch.journal.date,
          format: FORMAT,
          qrDataUrl: isLast ? quoteQrUrl : undefined,
        });
        const slideNum = String(i + 1).padStart(2, '0');
        const quoteFilename = `batch${batchNum}-03-quote-${slideNum}.png`;
        const quotePath = join(OUTPUT_DIR, quoteFilename);
        const quotePng = await generatePng(quoteElement, fonts, dimensions);
        await writeFile(quotePath, quotePng);
        success(`[3.${i + 1}] ${quoteFilename}`);
        totalCards++;

        carouselImages.push({
          path: quotePath,
          filename: quoteFilename,
          type: 'quote',
          metadata: quoteMeta,
          isCarouselPart: true,
          carouselIndex: i,
          carouselTotal: batch.quotes.length,
        });
      }

      postsToPublish.push({
        type: 'carousel',
        templateType: 'quote',
        images: carouselImages,
        metadata: quoteMeta,
        batchIdx,
        postIdx: postIdxInBatch++,
      });
    }

    // 4. Metalogue carousel (if metalogue fragments exist and journal is diptych)
    if (batch.metalogue && batch.metalogue.length > 0 && batch.journal.type === 'diptych') {
      const metalogueFragments = batch.metalogue as MetalogueFragment[];
      const metalogueMeta: MetalogueMetadata & { folderName: string } = {
        fragments: metalogueFragments,
        sourceTitle: batch.journal.title,
        date: batch.journal.date,
        slug: batch.journal.slug,
        folderName: batch.journal.folderName,
      };
      const metalogueQrUrl = await generateQRDataUrl(getContentUrl('metalogue', metalogueMeta));

      // Group fragments into slides (2-3 per slide)
      const slides: MetalogueFragment[][] = [];
      const FRAGMENTS_PER_SLIDE = 3;
      for (let i = 0; i < metalogueFragments.length; i += FRAGMENTS_PER_SLIDE) {
        slides.push(metalogueFragments.slice(i, i + FRAGMENTS_PER_SLIDE));
      }

      const metalogueCarouselImages: GeneratedImage[] = [];

      for (let i = 0; i < slides.length; i++) {
        const isLast = i === slides.length - 1;
        const metalogueElement = MetalogueTemplate({
          fragments: slides[i],
          sourceTitle: batch.journal.title,
          date: batch.journal.date,
          format: FORMAT,
          qrDataUrl: isLast ? metalogueQrUrl : undefined,
        });
        const slideNum = String(i + 1).padStart(2, '0');
        const metalogueFilename = `batch${batchNum}-04-metalogue-${slideNum}.png`;
        const metaloguePath = join(OUTPUT_DIR, metalogueFilename);
        const metaloguePng = await generatePng(metalogueElement, fonts, dimensions);
        await writeFile(metaloguePath, metaloguePng);
        success(`[4.${i + 1}] ${metalogueFilename}`);
        totalCards++;

        metalogueCarouselImages.push({
          path: metaloguePath,
          filename: metalogueFilename,
          type: 'metalogue',
          metadata: metalogueMeta,
          isCarouselPart: true,
          carouselIndex: i,
          carouselTotal: slides.length,
        });
      }

      postsToPublish.push({
        type: slides.length > 1 ? 'carousel' : 'single',
        templateType: 'metalogue',
        images: metalogueCarouselImages,
        metadata: metalogueMeta,
        batchIdx,
        postIdx: postIdxInBatch++,
      });
    }
  }

  return totalCards;
}
