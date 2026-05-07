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
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).optional(),
  }),
});

const ahora = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
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
  type: 'data',
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    mensaje: z.string(),
    timestamp: z.string(),
  }),
});

export const collections = { journal, specimens, cultivations, ahora, visitors };
