/**
 * Shared types for Instagram card generation handlers.
 */

import type { FontData } from '../../../../src/lib/shared-image-utils.ts';
import type { InstaFormat } from '../../../../src/lib/insta-templates.tsx';
import type {
  GeneratedPost,
  GeneratedCarousel,
} from '../../../lib/insta-publisher.ts';

/**
 * Result from a template handler.
 * - 'back': user navigated back, continue to previous step
 * - 'skip': content not available, show message and continue
 * - 'success': generated output with path and optional post/carousel metadata
 */
export type HandlerResult =
  | { status: 'back' }
  | { status: 'skip'; message: string }
  | {
      status: 'success';
      outputPath: string;
      post?: GeneratedPost;
      carousel?: GeneratedCarousel;
    };

/**
 * Context passed to template handlers.
 */
export interface HandlerContext {
  fonts: FontData[];
  format: InstaFormat;
  outputDir: string;
}

/**
 * Template handler function signature.
 * Each handler prompts for content, renders the template, and returns the result.
 */
export type TemplateHandler = (ctx: HandlerContext) => Promise<HandlerResult>;
