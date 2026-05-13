/**
 * Handler for specimen card generation.
 */

import { select } from '@inquirer/prompts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generatePng } from '../../../../src/lib/shared-image-utils.ts';
import {
  SpecimenTemplate,
  INSTA_DIMENSIONS,
} from '../../../../src/lib/insta-templates.tsx';
import type { SpecimenMetadata } from '../../../../src/lib/insta-captions.ts';
import {
  generateQRDataUrl,
  getContentUrl,
  type ExtendedSpecimenMetadata,
} from '../../../../src/lib/qr-utils.ts';
import { muted, success, blank } from '../../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  slugify,
} from '../../../lib/cli-utils.ts';
import {
  loadSpecimens,
  type Specimen,
} from '../../../lib/content-loaders.ts';
import type { HandlerContext, HandlerResult } from './types.ts';

/**
 * Generate specimen showcase card.
 */
export async function handleSpecimenCard(ctx: HandlerContext): Promise<HandlerResult> {
  const specimens = await loadSpecimens();
  if (specimens.length === 0) {
    muted('No specimens found.');
    blank();
    return { status: 'skip', message: 'No specimens found' };
  }

  const specimenOrBack = await select<Specimen | typeof BACK>({
    message: 'Select specimen:',
    choices: withBack(specimens.map((s) => ({
      value: s,
      name: `${s.name} (${s.status})`,
    }))),
  });

  if (specimenOrBack === BACK) return { status: 'back' };
  const specimen = specimenOrBack as Specimen;

  const extendedMeta: ExtendedSpecimenMetadata = {
    name: specimen.name,
    status: specimen.status,
    description: specimen.description,
    series: specimen.series,
    id: specimen.id,
  };
  const contentUrl = getContentUrl('specimen', extendedMeta);
  const qrDataUrl = await generateQRDataUrl(contentUrl);

  const element = SpecimenTemplate({
    name: specimen.name,
    status: specimen.status,
    description: specimen.description,
    series: specimen.series,
    seriesIndex: specimen.seriesIndex,
    format: ctx.format,
    qrDataUrl,
  });

  const filename = `specimen-${slugify(specimen.id)}.png`;
  const outputPath = join(ctx.outputDir, filename);
  const dimensions = INSTA_DIMENSIONS[ctx.format];
  const png = await generatePng(element, ctx.fonts, dimensions);
  await writeFile(outputPath, png);
  success(`Generated: ${filename}`);

  const specimenMeta: SpecimenMetadata = {
    name: specimen.name,
    status: specimen.status,
    description: specimen.description,
    series: specimen.series,
  };

  return {
    status: 'success',
    outputPath,
    post: {
      templateType: 'specimen',
      imagePath: outputPath,
      metadata: specimenMeta,
    },
  };
}
