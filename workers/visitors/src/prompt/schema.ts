/**
 * Zod schemas for prompt validation
 */

import { z } from 'zod';

/**
 * Version format: YYYY.season.patch
 * Example: 2026.spring.0, 2026.summer.1
 */
const VersionSchema = z
  .string()
  .regex(
    /^\d{4}\.(spring|summer|autumn|winter)\.\d+$/,
    'Version must be YYYY.season.patch (e.g., 2026.spring.0)'
  );

/**
 * Minimal pair: two words differing by one phoneme
 * Example: ["pain", "bain"]
 */
const MinimalPairSchema = z.tuple([z.string(), z.string()]);

/**
 * Dictionary arrays for random selection
 */
export const PromptDictionariesSchema = z.object({
  objects: z.array(z.string()).min(1),
  subjects: z.array(z.string()).min(1),
  events: z.array(z.string()).min(1),
  seasons: z.array(z.string()).min(1),
  metrics: z.array(z.string()).min(1),
  cadences: z.array(z.string()).min(1),
  minimal_pairs: z.array(MinimalPairSchema).min(1),
});

/**
 * Model configuration
 */
export const ModelConfigSchema = z.object({
  name: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
});

/**
 * Full prompt configuration
 */
export const PromptConfigSchema = z.object({
  version: VersionSchema,
  description: z.string(),
  template: z.string().min(1),
  dictionaries: PromptDictionariesSchema,
  model: ModelConfigSchema,
});

// Inferred types
export type PromptDictionaries = z.infer<typeof PromptDictionariesSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type PromptConfig = z.infer<typeof PromptConfigSchema>;
