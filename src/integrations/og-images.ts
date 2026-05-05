/**
 * Astro integration for generating OG images at build time.
 */

import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateOGImages } from '../lib/generate-og-images.ts';

export default function ogImagesIntegration(): AstroIntegration {
  return {
    name: 'og-images',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        // dir is a URL to the output directory
        const distDir = fileURLToPath(dir);
        // Get project root from this file's location
        const integrationDir = dirname(fileURLToPath(import.meta.url));
        const projectRoot = join(integrationDir, '..', '..');
        const srcDir = join(projectRoot, 'src');

        await generateOGImages({
          distDir,
          projectRoot,
          srcDir,
        });
      },
    },
  };
}
