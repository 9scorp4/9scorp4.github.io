import type { Env } from '../types';
import type { RateLimitEntry } from '../schema';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

export async function checkRateLimit(ipHash: string, env: Env): Promise<{ allowed: boolean }> {
  const key = `ratelimit:${ipHash}`;
  const stored = await env.VISITORS_KV.get(key);

  if (!stored) {
    return { allowed: true };
  }

  const entry: RateLimitEntry = JSON.parse(stored);
  const now = Date.now();

  // Reset if window expired
  if (now - entry.window_start >= RATE_LIMIT_WINDOW) {
    return { allowed: true };
  }

  return { allowed: entry.count < RATE_LIMIT_MAX };
}

export async function incrementRateLimit(ipHash: string, env: Env): Promise<void> {
  const key = `ratelimit:${ipHash}`;
  const stored = await env.VISITORS_KV.get(key);
  const now = Date.now();

  let entry: RateLimitEntry;
  if (!stored) {
    entry = { count: 1, window_start: now };
  } else {
    entry = JSON.parse(stored);
    if (now - entry.window_start >= RATE_LIMIT_WINDOW) {
      entry = { count: 1, window_start: now };
    } else {
      entry.count++;
    }
  }

  // Set TTL to slightly longer than window
  const ttl = Math.ceil(RATE_LIMIT_WINDOW / 1000) + 60;
  await env.VISITORS_KV.put(key, JSON.stringify(entry), { expirationTtl: ttl });
}
