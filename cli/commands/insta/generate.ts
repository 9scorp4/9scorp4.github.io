/**
 * Interactive Instagram card generator
 *
 * Generates quote, title, status, specimen, and intro carousel cards.
 * Uses Satori + Resvg for rendering.
 */

import { select, confirm } from '@inquirer/prompts';
import { mkdir } from 'node:fs/promises';
import { loadFonts } from '../../../src/lib/shared-image-utils.ts';
import type { InstaFormat } from '../../../src/lib/insta-templates.tsx';
import { title, print, success, blank } from '../../lib/cli-style.ts';
import {
  BACK,
  withBack,
  openFile,
  getProjectRoot,
  getOutputDir,
} from '../../lib/cli-utils.ts';
import {
  publishPostInteractive,
  publishCarouselInteractive,
} from '../../lib/insta-publisher.ts';
import {
  handleQuoteCard,
  handleTitleCard,
  handleStatusCard,
  handleSpecimenCard,
  handleIntroCarousel,
  type TemplateHandler,
} from './handlers/index.ts';

const PROJECT_ROOT = getProjectRoot();
const OUTPUT_DIR = getOutputDir();

type TemplateChoice = 'quote' | 'title' | 'status' | 'specimen' | 'intro';

const handlers: Record<TemplateChoice, TemplateHandler> = {
  quote: handleQuoteCard,
  title: handleTitleCard,
  status: handleStatusCard,
  specimen: handleSpecimenCard,
  intro: handleIntroCarousel,
};

// ─────────────────────────────────────────────────────────────
// Main flow
// ─────────────────────────────────────────────────────────────

export async function run(_args: string[], publishMode = false): Promise<void> {
  title('instagram content generator');

  await mkdir(OUTPUT_DIR, { recursive: true });

  print('loading fonts...');
  const fonts = await loadFonts(PROJECT_ROOT);

  let continueGenerating = true;

  while (continueGenerating) {
    let templateType: TemplateChoice | typeof BACK;
    let format: InstaFormat | typeof BACK;

    stepTemplate:
    while (true) {
      templateType = await select<TemplateChoice | typeof BACK>({
        message: 'What would you like to create?',
        choices: [
          { value: 'quote' as const, name: 'Quote card — excerpt from journal entry' },
          { value: 'title' as const, name: 'Title card — entry title + date + mandala' },
          { value: 'status' as const, name: 'Status update — ahora dispatch' },
          { value: 'specimen' as const, name: 'Specimen showcase — from conservatory' },
          { value: 'intro' as const, name: 'Intro carousel — welcome to the garden (10 slides)' },
        ],
      });

      stepFormat:
      while (true) {
        format = await select<InstaFormat | typeof BACK>({
          message: 'Select format:',
          choices: withBack([
            { value: 'square' as const, name: 'Square (1080×1080)' },
            { value: 'portrait' as const, name: 'Portrait (1080×1350)' },
          ]),
        });

        if (format === BACK) continue stepTemplate;
        break stepFormat;
      }
      break stepTemplate;
    }

    // Call the appropriate handler
    const handler = handlers[templateType as TemplateChoice];
    const result = await handler({
      fonts,
      format: format as InstaFormat,
      outputDir: OUTPUT_DIR,
    });

    // Handle result status
    if (result.status === 'back') continue;
    if (result.status === 'skip') continue;

    const { outputPath, post, carousel } = result;

    // Preview flow
    const shouldPreview = await confirm({
      message: 'Preview image?',
      default: true,
    });

    if (shouldPreview) {
      openFile(outputPath);
    }

    print(`Output: ${outputPath}`);
    blank();

    // Publish flow
    if (publishMode && post) {
      const shouldPublish = await confirm({
        message: 'Publish to Instagram via Buffer?',
        default: true,
      });

      if (shouldPublish) {
        await publishPostInteractive(post);
      }
    }

    if (publishMode && carousel) {
      const shouldPublish = await confirm({
        message: `Publish carousel (${carousel.imagePaths.length} images) to Instagram via Buffer?`,
        default: true,
      });

      if (shouldPublish) {
        await publishCarouselInteractive(carousel);
      }
    }

    continueGenerating = await confirm({
      message: 'Generate another?',
      default: true,
    });
  }

  success('done');
  blank();
}

// ─────────────────────────────────────────────────────────────
// Exports for testing
// ─────────────────────────────────────────────────────────────

export { extractParagraphs } from '../../lib/content-loaders.ts';
