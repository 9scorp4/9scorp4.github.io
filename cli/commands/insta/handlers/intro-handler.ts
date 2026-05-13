/**
 * Handler for intro carousel generation.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generatePng } from '../../../../src/lib/shared-image-utils.ts';
import {
  IntroSlideTemplate,
  INSTA_DIMENSIONS,
} from '../../../../src/lib/insta-templates.tsx';
import type { IntroMetadata } from '../../../../src/lib/insta-captions.ts';
import { print, success } from '../../../lib/cli-style.ts';
import { getIntroSlides } from '../../../lib/intro-visuals.tsx';
import type { HandlerContext, HandlerResult } from './types.ts';

/**
 * Generate intro carousel (10 slides, always square format).
 */
export async function handleIntroCarousel(ctx: HandlerContext): Promise<HandlerResult> {
  print('Generating intro carousel...');

  const introSlides = getIntroSlides();
  const dimensions = INSTA_DIMENSIONS.square;
  const introPaths: string[] = [];

  for (let i = 0; i < introSlides.length; i++) {
    const slide = introSlides[i];
    const slideNum = String(i + 1).padStart(2, '0');
    const filename = `intro-${slideNum}.png`;

    const element = IntroSlideTemplate({
      headline: slide.headline,
      subtext: slide.subtext,
      showMandala: slide.showMandala,
      showSunAccent: slide.showSunAccent,
      monospace: slide.monospace,
      customVisual: slide.customVisual,
      showSiteFooter: slide.showSiteFooter,
      siteUrl: slide.siteUrl,
      format: 'square',
    });

    const path = join(ctx.outputDir, filename);
    const png = await generatePng(element, ctx.fonts, dimensions);
    await writeFile(path, png);
    introPaths.push(path);
    success(`[${slideNum}] ${filename}`);
  }

  print(`Generated ${introSlides.length} slides`);

  const introMeta: IntroMetadata = { slideCount: introSlides.length };

  return {
    status: 'success',
    outputPath: introPaths[0],
    carousel: {
      templateType: 'intro',
      imagePaths: introPaths,
      metadata: introMeta,
    },
  };
}
