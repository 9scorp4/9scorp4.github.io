/**
 * Shared utilities for image generation with Satori + Resvg.
 * Used by both OG images and Instagram content generator.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface FontData {
  name: string;
  data: ArrayBuffer;
  weight: 400;
  style: 'normal' | 'italic';
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Load IM Fell DW Pica fonts from fontsource.
 * Satori requires woff (not woff2).
 */
export async function loadFonts(projectRoot: string): Promise<FontData[]> {
  const fontsourceDir = join(projectRoot, 'node_modules', '@fontsource', 'im-fell-dw-pica', 'files');

  const [regularBuffer, italicBuffer] = await Promise.all([
    readFile(join(fontsourceDir, 'im-fell-dw-pica-latin-400-normal.woff')),
    readFile(join(fontsourceDir, 'im-fell-dw-pica-latin-400-italic.woff')),
  ]);

  return [
    {
      name: 'IM Fell DW Pica',
      data: regularBuffer.buffer.slice(
        regularBuffer.byteOffset,
        regularBuffer.byteOffset + regularBuffer.byteLength
      ),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'IM Fell DW Pica',
      data: italicBuffer.buffer.slice(
        italicBuffer.byteOffset,
        italicBuffer.byteOffset + italicBuffer.byteLength
      ),
      weight: 400 as const,
      style: 'italic' as const,
    },
  ];
}

/**
 * Generate a PNG buffer from a React element using Satori + Resvg.
 */
export async function generatePng(
  element: React.ReactElement,
  fonts: FontData[],
  dimensions: ImageDimensions
): Promise<Buffer> {
  const svg = await satori(element, {
    width: dimensions.width,
    height: dimensions.height,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: dimensions.width,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}
