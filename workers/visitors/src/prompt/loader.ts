/**
 * Prompt loading and interpolation
 */

import { PromptConfigSchema, type PromptConfig, type ModelConfig } from './schema';
import bonjourData from './bonjour.json';

// Validate at import time (fails fast if schema is wrong)
const promptConfig: PromptConfig = PromptConfigSchema.parse(bonjourData);

/**
 * Context values used when interpolating a prompt
 */
export interface InterpolationContext {
  object: string;
  subject: string;
  event: string;
  metric: string;
  cadence: string;
  minimalPair1: [string, string];
  minimalPair2: [string, string];
}

/**
 * Result of prompt interpolation
 */
export interface InterpolatedPrompt {
  prompt: string;
  context: InterpolationContext;
  version: string;
}

/**
 * Pick a random element from an array
 */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick two different random elements from an array
 */
function pickTwoRandom<T>(arr: readonly T[]): [T, T] {
  const first = pickRandom(arr);
  const remaining = arr.filter(item => item !== first);
  const second = remaining.length > 0 ? pickRandom(remaining) : first;
  return [first, second];
}

/**
 * Format a minimal pair for display
 */
function formatMinimalPair(pair: [string, string]): string {
  return `${pair[0]}/${pair[1]}`;
}

/**
 * Interpolate the prompt template with random dictionary values
 */
export function interpolatePrompt(): InterpolatedPrompt {
  const { template, dictionaries } = promptConfig;

  const context: InterpolationContext = {
    object: pickRandom(dictionaries.objects),
    subject: pickRandom(dictionaries.subjects),
    event: pickRandom(dictionaries.events),
    metric: pickRandom(dictionaries.metrics),
    cadence: pickRandom(dictionaries.cadences),
    minimalPair1: pickRandom(dictionaries.minimal_pairs) as [string, string],
    minimalPair2: pickRandom(dictionaries.minimal_pairs) as [string, string],
  };

  // Ensure minimal pairs are different
  const [pair1, pair2] = pickTwoRandom(dictionaries.minimal_pairs);
  context.minimalPair1 = pair1 as [string, string];
  context.minimalPair2 = pair2 as [string, string];

  const prompt = template
    .replace('{{OBJECT}}', context.object)
    .replace('{{SUBJECT}}', context.subject)
    .replace('{{EVENT}}', context.event)
    .replace('{{METRIC}}', context.metric)
    .replace('{{CADENCE}}', context.cadence)
    .replace('{{MINIMAL_PAIR_1}}', formatMinimalPair(context.minimalPair1))
    .replace('{{MINIMAL_PAIR_2}}', formatMinimalPair(context.minimalPair2));

  return {
    prompt,
    context,
    version: promptConfig.version,
  };
}

/**
 * Get the model configuration
 */
export function getModelConfig(): ModelConfig {
  return promptConfig.model;
}

/**
 * Get the current prompt version
 */
export function getPromptVersion(): string {
  return promptConfig.version;
}

/**
 * Get the full prompt configuration (for admin inspection)
 */
export function getPromptConfig(): PromptConfig {
  return promptConfig;
}
