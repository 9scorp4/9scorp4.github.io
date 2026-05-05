import { defineCollection, z } from 'astro:content';

const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    title_secondary: z.string().optional(),        // bilingual subtitle
    date: z.date(),
    entry: z.number(),
    language: z.enum(['en', 'es', 'fr']).default('en'),
    summary: z.string(),
    draft: z.boolean().default(false),
    // Diptych fields
    type: z.enum(['article', 'diptych']).default('article'),
    preamble: z.string().optional(),
    metalogue_title: z.string().optional(),
    metalogue_epigraph: z.string().optional(),
    colophon: z.string().optional(),
  }),
});

const specimens = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),         // 'sig-001' or 'rf-001'
    name: z.string(),
    grown: z.date(),
    sketch: z.string(),     // path to p5 entry point
    description: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
    // Series support (e.g., redflag.exe)
    series: z.string().optional(),           // 'redflag'
    seriesIndex: z.number().optional(),      // 1-10
    thumbnail: z.string().optional(),        // path to static preview image
    aspectRatio: z.enum(['1:1', '9:16', '4:5']).optional(),
  }),
});

const cultivations = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
    description: z.string(),
    repo: z.string().url().optional(),
  }),
});

const ahora = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
  }),
});

const visitors = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    mensaje: z.string(),
    timestamp: z.string(),
  }),
});

export const collections = { journal, specimens, cultivations, ahora, visitors };
