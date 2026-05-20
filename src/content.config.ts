import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const journal = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    title_secondary: z.string().optional(),        // bilingual subtitle
    date: z.coerce.date(),
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
    // Series fields
    series: z.string().optional(),                 // series id, e.g., 'smash-laterally'
    seriesIndex: z.number().optional(),            // 1, 2, 3...
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/series' }),
  schema: z.object({
    id: z.string(),                                // 'smash-laterally'
    title: z.string(),                             // "if you can't smash the top, smash it laterally"
    title_secondary: z.string().optional(),
    description: z.string(),
    totalParts: z.number(),
    started: z.coerce.date(),
    completed: z.coerce.date().optional(),
    status: z.enum(['growing', 'complete']).default('growing'),
  }),
});

const specimens = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/specimens' }),
  schema: z.object({
    id: z.string(),         // 'sig-001' or 'rf-001'
    name: z.string(),
    grown: z.coerce.date(),
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
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cultivations' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
    description: z.string(),
    repo: z.string().url().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).optional(),
  }),
});

const ahora = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ahora' }),
  schema: z.object({
    date: z.coerce.date(),
    escuchando: z.array(z.object({
      // === Required ===
      artist: z.string(),
      title: z.string(),
      url: z.string().url(),              // YouTube Music, Spotify, etc.

      // === Objective: from GetSongBPM ===
      bpm: z.number().optional(),
      key: z.string().optional(),         // "Em", "C#m", "F"
      timeSignature: z.string().optional(), // "4/4", "3/4", "6/8"
      openKey: z.string().optional(),     // Camelot/Open Key notation: "2m", "8d"
      danceability: z.number().min(0).max(100).optional(),
      acousticness: z.number().min(0).max(100).optional(),
      songbpmId: z.string().optional(),   // for re-enrichment

      // === Source verification ===
      sourceVerified: z.boolean().optional(),  // true = human-checked, skip on re-enrichment
      corrections: z.string().optional(),      // what was wrong, e.g. "openKey was 9m"

      // === Objective: general ===
      year: z.number().optional(),        // release year
      album: z.string().optional(),
      duration: z.number().optional(),    // seconds
      genre: z.array(z.string()).optional(),

      // === Subjective: manual ===
      energy: z.number().min(1).max(10).optional(),   // personal energy rating
      mood: z.array(z.string()).optional(),           // e.g., ["melancholic", "driving"]
      context: z.array(z.string()).optional(),        // e.g., ["gym", "focus", "cooking"]
      discovered: z.string().optional(),              // e.g., "algorithm", "friend:Ana", "radio"
      notes: z.string().optional(),                   // free-form
    })).optional(),

    // New article announcement
    articuloNuevo: z.array(z.object({
      article: z.string(),        // journal entry slug
      note: z.string().optional(),
    })).optional(),

    // New specimen announcement
    specimenNuevo: z.array(z.object({
      specimen: z.string(),       // specimen id (e.g., 'sig-001')
      note: z.string().optional(),
    })).optional(),

    // Cultivation updates
    cultivando: z.array(z.object({
      cultivation: z.string(),    // cultivation slug
      note: z.string().optional(),
    })).optional(),
  }),
});

const visitors = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/visitors' }),
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    mensaje: z.string(),
    timestamp: z.string(),
  }),
});

export const collections = { journal, specimens, cultivations, ahora, visitors, series };
