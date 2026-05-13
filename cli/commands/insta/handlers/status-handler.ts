/**
 * Handler for status card generation (ahora dispatches).
 */

import { select } from '@inquirer/prompts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generatePng } from '../../../../src/lib/shared-image-utils.ts';
import {
  StatusTemplate,
  INSTA_DIMENSIONS,
} from '../../../../src/lib/insta-templates.tsx';
import type { StatusMetadata } from '../../../../src/lib/insta-captions.ts';
import { generateQRDataUrl, getContentUrl } from '../../../../src/lib/qr-utils.ts';
import { muted, success, blank } from '../../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  formatDate,
} from '../../../lib/cli-utils.ts';
import {
  loadAhoraEntries,
  type AhoraEntry,
} from '../../../lib/content-loaders.ts';
import type { HandlerContext, HandlerResult } from './types.ts';

/**
 * Generate status card from ahora dispatch.
 */
export async function handleStatusCard(ctx: HandlerContext): Promise<HandlerResult> {
  const entries = await loadAhoraEntries();
  if (entries.length === 0) {
    muted('No ahora entries found.');
    blank();
    return { status: 'skip', message: 'No ahora entries found' };
  }

  const entryOrBack = await select<AhoraEntry | typeof BACK>({
    message: 'Select ahora dispatch:',
    choices: withBack(entries.map((e) => ({
      value: e,
      name: formatDate(e.date),
    }))),
  });

  if (entryOrBack === BACK) return { status: 'back' };
  const entry = entryOrBack as AhoraEntry;

  const statusMeta: StatusMetadata = {
    date: entry.date,
    temperatura: entry.temperatura,
    escuchando: entry.escuchando,
    cultivando: entry.cultivando,
  };
  const contentUrl = getContentUrl('status', statusMeta);
  const qrDataUrl = await generateQRDataUrl(contentUrl);

  const element = StatusTemplate({
    date: entry.date,
    temperatura: entry.temperatura,
    escuchando: entry.escuchando,
    cultivando: entry.cultivando,
    format: ctx.format,
    qrDataUrl,
  });

  const dateStr = entry.date.toISOString().split('T')[0];
  const filename = `ahora-${dateStr}.png`;
  const outputPath = join(ctx.outputDir, filename);
  const dimensions = INSTA_DIMENSIONS[ctx.format];
  const png = await generatePng(element, ctx.fonts, dimensions);
  await writeFile(outputPath, png);
  success(`Generated: ${filename}`);

  return {
    status: 'success',
    outputPath,
    post: {
      templateType: 'status',
      imagePath: outputPath,
      metadata: statusMeta,
    },
  };
}
