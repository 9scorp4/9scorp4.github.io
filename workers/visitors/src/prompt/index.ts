/**
 * Prompt management module
 *
 * Re-exports the public API for prompt loading and interpolation.
 */

export {
  interpolatePrompt,
  getModelConfig,
  getPromptVersion,
  getPromptConfig,
  type InterpolationContext,
  type InterpolatedPrompt,
} from './loader';

export type { PromptConfig, PromptDictionaries, ModelConfig } from './schema';
