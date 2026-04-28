import { defineCollection, z } from 'astro:content';

const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    entry: z.number(),
    language: z.enum(['en', 'es', 'fr']).default('en'),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

const specimens = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),         // 'sig-001'
    name: z.string(),
    grown: z.date(),
    sketch: z.string(),     // path to p5 entry point
    description: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
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

export const collections = { journal, specimens, cultivations };
