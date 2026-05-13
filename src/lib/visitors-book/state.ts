/**
 * localStorage state management with migrations
 */

import type { VisitorState, VisitorStateV1 } from './types';

const STORAGE_KEY = 'jardin-visitor';
const CURRENT_VERSION = 2;

/**
 * Create a fresh default state
 */
export function createDefaultState(): VisitorState {
  return {
    version: 2,
    visits: 0,
    lastVisit: '',
    waterings: 0,
    seedPlanted: false,
    seedCount: 0,
    stats: {
      pagesViewed: 0,
      articlesRead: [],
      commandsUsed: 0,
      secretsFound: [],
      firstVisit: new Date().toISOString(),
    },
  };
}

/**
 * Migrate stored state to current version
 */
export function migrateState(stored: unknown): VisitorState {
  // If unparseable or not an object, reinitialize
  if (!stored || typeof stored !== 'object') {
    return createDefaultState();
  }

  const state = stored as Record<string, unknown>;

  // Version 0 (no version field) -> Version 2
  if (!('version' in state) || state.version === undefined) {
    return {
      version: 2,
      visits: typeof state.visits === 'number' ? state.visits : 0,
      lastVisit: typeof state.lastVisit === 'string' ? state.lastVisit : '',
      waterings: typeof state.waterings === 'number' ? state.waterings : 0,
      seedPlanted: typeof state.seedPlanted === 'boolean' ? state.seedPlanted : false,
      seedCount: typeof state.seedCount === 'number' ? state.seedCount : 0,
      stats: {
        pagesViewed: 0,
        articlesRead: [],
        commandsUsed: 0,
        secretsFound: [],
        firstVisit: new Date().toISOString(),
      },
    };
  }

  // Version 1 -> Version 2
  if (state.version === 1) {
    const v1 = state as unknown as VisitorStateV1;
    return {
      version: 2,
      visits: v1.visits,
      lastVisit: v1.lastVisit,
      waterings: v1.waterings,
      seedPlanted: v1.seedPlanted,
      seedCount: v1.seedCount,
      stats: {
        pagesViewed: v1.visits, // Approximate from visits
        articlesRead: [],
        commandsUsed: 0,
        secretsFound: v1.seedPlanted ? ['seed'] : [], // Infer from seedPlanted
        firstVisit: v1.lastVisit || new Date().toISOString(),
      },
    };
  }

  // Already current version
  if (state.version === CURRENT_VERSION) {
    return state as unknown as VisitorState;
  }

  // Unknown future version — reinitialize
  return createDefaultState();
}

/**
 * Get visitor state from localStorage (with migration)
 */
export function getVisitorState(): VisitorState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateState(parsed);
    }
  } catch {
    // localStorage unavailable or corrupted
  }
  return createDefaultState();
}

/**
 * Save visitor state to localStorage
 */
export function saveVisitorState(state: VisitorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Clear visitor state from localStorage
 */
export function clearVisitorState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
