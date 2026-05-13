import type { Env } from '../types';
import { RatingSchema } from '../schema';
import { submitRating } from '../ratings';
import { composeBonjour } from '../bonjour';
import {
  getDailyPoem,
  getDailyPoemWithMeta,
  listRecentPoems,
  listPoemsByVersion,
  prunePoem,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  generatePoem,
  storeDailyPoem,
  getCurrentPromptVersion,
} from '../poem';
import { interpolatePrompt, getPromptConfig } from '../prompt';
import { json, hashString } from '../lib';

export async function handleBonjour(env: Env): Promise<Response> {
  const response = await composeBonjour({ VISITORS_KV: env.VISITORS_KV });
  return json(response);
}

export async function handleBonjourRate(request: Request, env: Env): Promise<Response> {
  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid request body' }, 400);
  }

  const parsed = RatingSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'invalid rating' }, 400);
  }

  // Hash client IP
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(clientIp);

  // Submit rating
  const result = await submitRating(
    env.VISITORS_KV,
    parsed.data.poemHash,
    parsed.data.rating,
    ipHash
  );

  if (!result.ok) {
    return json({ ok: false, error: result.error });
  }

  return json({ ok: true, message: 'note.' });
}

export async function handleBonjourGenerate(env: Env): Promise<Response> {
  const result = await generatePoem({ VISITORS_KV: env.VISITORS_KV, GROQ_API_KEY: env.GROQ_API_KEY });
  if (!result) {
    return json({ error: 'poem generation failed' }, 500);
  }
  await storeDailyPoem(env.VISITORS_KV, result);
  return json({
    ok: true,
    poem: result.poem,
    promptVersion: result.promptVersion,
    promptText: result.promptText,
    context: result.context,
  });
}

export async function handleBonjourList(env: Env, days: number): Promise<Response> {
  const poems = await listRecentPoems(env.VISITORS_KV, days);
  return json({ poems });
}

export async function handleBonjourShow(env: Env, date: string): Promise<Response> {
  const poem = await getDailyPoemWithMeta(env.VISITORS_KV, date);
  if (!poem) {
    return json({ error: 'poem not found' }, 404);
  }
  return json(poem);
}

export async function handleBonjourFavorite(env: Env, date: string): Promise<Response> {
  const poem = await getDailyPoem(env.VISITORS_KV, date);
  if (!poem) {
    return json({ error: 'poem not found' }, 404);
  }
  const id = await addToFavorites(env.VISITORS_KV, date, poem);
  return json({ ok: true, id });
}

export async function handleBonjourPrune(env: Env, date: string): Promise<Response> {
  const deleted = await prunePoem(env.VISITORS_KV, date);
  if (!deleted) {
    return json({ error: 'poem not found' }, 404);
  }
  return json({ ok: true });
}

export async function handleBonjourFavorites(env: Env): Promise<Response> {
  const favorites = await getFavorites(env.VISITORS_KV);
  return json({ favorites });
}

export async function handleBonjourRemoveFavorite(env: Env, id: string): Promise<Response> {
  const removed = await removeFromFavorites(env.VISITORS_KV, id);
  if (!removed) {
    return json({ error: 'favorite not found' }, 404);
  }
  return json({ ok: true });
}

export async function handleBonjourPrompt(): Promise<Response> {
  const config = getPromptConfig();
  return json({
    version: config.version,
    description: config.description,
    template: config.template,
    dictionaries: {
      objects: config.dictionaries.objects.length,
      subjects: config.dictionaries.subjects.length,
      events: config.dictionaries.events.length,
      metrics: config.dictionaries.metrics.length,
      cadences: config.dictionaries.cadences.length,
      minimal_pairs: config.dictionaries.minimal_pairs.length,
    },
    model: config.model,
  });
}

export async function handleBonjourPromptTest(): Promise<Response> {
  const result = interpolatePrompt();
  return json({
    version: result.version,
    prompt: result.prompt,
    context: result.context,
  });
}

export async function handleBonjourPromptHistory(env: Env, days: number): Promise<Response> {
  const byVersion = await listPoemsByVersion(env.VISITORS_KV, days);
  const history: { version: string; count: number; dates: string[] }[] = [];

  for (const [version, poems] of byVersion) {
    history.push({
      version,
      count: poems.length,
      dates: poems.map(p => p.date),
    });
  }

  // Sort by version (most recent first, legacy last)
  history.sort((a, b) => {
    if (a.version === 'legacy') return 1;
    if (b.version === 'legacy') return -1;
    return b.version.localeCompare(a.version);
  });

  return json({
    currentVersion: getCurrentPromptVersion(),
    history,
  });
}
