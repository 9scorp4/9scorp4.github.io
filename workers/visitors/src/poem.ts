/**
 * Groq API client for daily surrealist poem generation
 */

import {
  interpolatePrompt,
  getModelConfig,
  getPromptVersion,
  type InterpolationContext,
} from './prompt';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// No TTL — poems persist until pruned by rating system or admin

/**
 * Generate a 12-character hash from poem text for identification
 */
export async function getPoemHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

export interface FavoritePoem {
  id: string;
  date: string;
  text: string;
  addedAt: string;
}

/**
 * Stored poem with version metadata (new format)
 */
export interface StoredPoem {
  text: string;
  promptVersion: string;
  promptText: string;
  context: InterpolationContext;
  generatedAt: string;
}

/**
 * Result of poem generation
 */
export interface GeneratedPoem {
  poem: string;
  promptVersion: string;
  promptText: string;
  context: InterpolationContext;
}

/**
 * Poem with optional metadata (for backward compatibility)
 */
export interface PoemWithMeta {
  date: string;
  text: string;
  promptVersion?: string;
  promptText?: string;
  context?: InterpolationContext;
  generatedAt?: string;
}

export interface PoemEnv {
  VISITORS_KV: KVNamespace;
  GROQ_API_KEY: string;
}

/**
 * Generate a poem using Groq API
 */
export async function generatePoem(env: PoemEnv): Promise<GeneratedPoem | null> {
  try {
    const { prompt, context, version } = interpolatePrompt();
    const modelConfig = getModelConfig();

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    return {
      poem: content,
      promptVersion: version,
      promptText: prompt,
      context,
    };
  } catch (error) {
    console.error('Poem generation failed:', error);
    return null;
  }
}

/**
 * Store a daily poem in KV with date key (includes metadata)
 */
export async function storeDailyPoem(
  kv: KVNamespace,
  poem: GeneratedPoem,
  date?: string
): Promise<void> {
  const dateKey = date || new Date().toISOString().slice(0, 10);

  const stored: StoredPoem = {
    text: poem.poem,
    promptVersion: poem.promptVersion,
    promptText: poem.promptText,
    context: poem.context,
    generatedAt: new Date().toISOString(),
  };

  await kv.put(`bonjour:daily:${dateKey}`, JSON.stringify(stored));
}

/**
 * Parse stored poem data (handles both old string and new JSON format)
 */
function parseStoredPoem(data: string, date: string): PoemWithMeta {
  try {
    const parsed = JSON.parse(data) as StoredPoem;
    // Validate it's the new format
    if (typeof parsed.text === 'string' && typeof parsed.promptVersion === 'string') {
      return {
        date,
        text: parsed.text,
        promptVersion: parsed.promptVersion,
        promptText: parsed.promptText,
        context: parsed.context,
        generatedAt: parsed.generatedAt,
      };
    }
  } catch {
    // Not JSON - old format (raw string)
  }

  // Old format: raw poem text
  return {
    date,
    text: data,
  };
}

/**
 * Get today's (or specified date's) poem text only (backward compatible)
 */
export async function getDailyPoem(kv: KVNamespace, date?: string): Promise<string | null> {
  const dateKey = date || new Date().toISOString().slice(0, 10);
  const stored = await kv.get(`bonjour:daily:${dateKey}`);
  if (!stored) return null;

  const parsed = parseStoredPoem(stored, dateKey);
  return parsed.text;
}

/**
 * Get poem with full metadata
 */
export async function getDailyPoemWithMeta(
  kv: KVNamespace,
  date?: string
): Promise<PoemWithMeta | null> {
  const dateKey = date || new Date().toISOString().slice(0, 10);
  const stored = await kv.get(`bonjour:daily:${dateKey}`);
  if (!stored) return null;

  return parseStoredPoem(stored, dateKey);
}

/**
 * Get the favorites pool
 */
export async function getFavorites(kv: KVNamespace): Promise<FavoritePoem[]> {
  const stored = await kv.get('bonjour:favorites');
  if (!stored) return [];
  try {
    return JSON.parse(stored) as FavoritePoem[];
  } catch {
    return [];
  }
}

/**
 * Add a poem to favorites
 */
export async function addToFavorites(kv: KVNamespace, date: string, text: string): Promise<string> {
  const favorites = await getFavorites(kv);

  // Generate ULID-style ID
  const timestamp = Date.now().toString(36).padStart(10, '0');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(36))
    .join('')
    .slice(0, 6);
  const id = `fav:${timestamp}${random}`.toUpperCase();

  const favorite: FavoritePoem = {
    id,
    date,
    text,
    addedAt: new Date().toISOString(),
  };

  favorites.push(favorite);
  await kv.put('bonjour:favorites', JSON.stringify(favorites));
  return id;
}

/**
 * Remove a poem from favorites
 */
export async function removeFromFavorites(kv: KVNamespace, id: string): Promise<boolean> {
  const favorites = await getFavorites(kv);
  const index = favorites.findIndex(f => f.id === id);
  if (index === -1) return false;

  favorites.splice(index, 1);
  await kv.put('bonjour:favorites', JSON.stringify(favorites));
  return true;
}

/**
 * List recent poems (for admin) - returns with metadata when available
 */
export async function listRecentPoems(
  kv: KVNamespace,
  days: number = 7
): Promise<PoemWithMeta[]> {
  const poems: PoemWithMeta[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().slice(0, 10);
    const poem = await getDailyPoemWithMeta(kv, dateKey);
    if (poem) {
      poems.push(poem);
    }
  }

  return poems;
}

/**
 * List poems grouped by prompt version (for admin)
 */
export async function listPoemsByVersion(
  kv: KVNamespace,
  days: number = 30
): Promise<Map<string, PoemWithMeta[]>> {
  const poems = await listRecentPoems(kv, days);
  const byVersion = new Map<string, PoemWithMeta[]>();

  for (const poem of poems) {
    const version = poem.promptVersion || 'legacy';
    const group = byVersion.get(version) || [];
    group.push(poem);
    byVersion.set(version, group);
  }

  return byVersion;
}

/**
 * Delete a poem (prune)
 */
export async function prunePoem(kv: KVNamespace, date: string): Promise<boolean> {
  const key = `bonjour:daily:${date}`;
  const existing = await kv.get(key);
  if (!existing) return false;
  await kv.delete(key);
  return true;
}

/**
 * Cron entry point: generate today's poem
 */
export async function runDailyCron(env: PoemEnv): Promise<void> {
  const result = await generatePoem(env);
  if (result) {
    await storeDailyPoem(env.VISITORS_KV, result);
    console.log(`Daily poem generated (prompt ${result.promptVersion})`);
  } else {
    console.error('Failed to generate daily poem');
  }
}

/**
 * Get current prompt version (for inspection)
 */
export function getCurrentPromptVersion(): string {
  return getPromptVersion();
}
