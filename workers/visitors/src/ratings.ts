/**
 * Poem rating system for bonjour command
 *
 * Thresholds:
 * - PROMOTE: ≥10 votes AND ≥60% bien → add to favorites
 * - PRUNE:   ≥8 votes AND ≥50% nul  → delete daily poem
 */

import type { PoemRatings, Rating } from './schema';
import { addToFavorites, prunePoem } from './poem';

const RATINGS_TTL = 30 * 24 * 60 * 60; // 30 days
const PROMOTE_MIN_VOTES = 10;
const PROMOTE_BIEN_RATIO = 0.6;
const PRUNE_MIN_VOTES = 8;
const PRUNE_NUL_RATIO = 0.5;

/**
 * Get ratings record for a poem
 */
export async function getRatings(kv: KVNamespace, poemHash: string): Promise<PoemRatings | null> {
  const stored = await kv.get(`bonjour:ratings:${poemHash}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as PoemRatings;
  } catch {
    return null;
  }
}

/**
 * Initialize ratings record if it doesn't exist
 */
export async function initRatingsRecord(
  kv: KVNamespace,
  poemHash: string,
  poemText: string,
  source: 'daily' | 'favorite',
  sourceDate?: string
): Promise<PoemRatings> {
  const existing = await getRatings(kv, poemHash);
  if (existing) return existing;

  const now = new Date().toISOString();
  const ratings: PoemRatings = {
    poemText,
    ratings: { bien: 0, bof: 0, nul: 0 },
    raters: [],
    firstRated: now,
    lastRated: now,
    source,
    sourceDate,
  };

  await kv.put(`bonjour:ratings:${poemHash}`, JSON.stringify(ratings), {
    expirationTtl: RATINGS_TTL,
  });

  return ratings;
}

/**
 * Submit a rating for a poem
 * Returns: { ok: true } | { ok: false, error: string }
 */
export async function submitRating(
  kv: KVNamespace,
  poemHash: string,
  rating: Rating['rating'],
  ipHash: string
): Promise<{ ok: true; promoted?: boolean; pruned?: boolean } | { ok: false; error: string }> {
  const ratings = await getRatings(kv, poemHash);

  if (!ratings) {
    return { ok: false, error: 'poeme inconnu.' };
  }

  // Check if already voted
  if (ratings.raters.includes(ipHash)) {
    return { ok: false, error: 'deja vote.' };
  }

  // Update ratings
  ratings.ratings[rating]++;
  ratings.raters.push(ipHash);
  ratings.lastRated = new Date().toISOString();

  // Save updated ratings
  await kv.put(`bonjour:ratings:${poemHash}`, JSON.stringify(ratings), {
    expirationTtl: RATINGS_TTL,
  });

  // Check thresholds for daily poems only
  let promoted = false;
  let pruned = false;

  if (ratings.source === 'daily') {
    promoted = await checkPromotion(kv, ratings);
    if (!promoted) {
      pruned = await checkPruning(kv, ratings);
    }
  }

  return { ok: true, promoted, pruned };
}

/**
 * Check if a poem should be promoted to favorites
 */
async function checkPromotion(kv: KVNamespace, ratings: PoemRatings): Promise<boolean> {
  const totalVotes = ratings.ratings.bien + ratings.ratings.bof + ratings.ratings.nul;

  if (totalVotes < PROMOTE_MIN_VOTES) return false;

  const bienRatio = ratings.ratings.bien / totalVotes;
  if (bienRatio < PROMOTE_BIEN_RATIO) return false;

  // Promote to favorites
  if (ratings.sourceDate) {
    await addToFavorites(kv, ratings.sourceDate, ratings.poemText);
    return true;
  }

  return false;
}

/**
 * Check if a poem should be pruned
 */
async function checkPruning(kv: KVNamespace, ratings: PoemRatings): Promise<boolean> {
  const totalVotes = ratings.ratings.bien + ratings.ratings.bof + ratings.ratings.nul;

  if (totalVotes < PRUNE_MIN_VOTES) return false;

  const nulRatio = ratings.ratings.nul / totalVotes;
  if (nulRatio < PRUNE_NUL_RATIO) return false;

  // Prune the poem
  if (ratings.sourceDate) {
    await prunePoem(kv, ratings.sourceDate);
    return true;
  }

  return false;
}
