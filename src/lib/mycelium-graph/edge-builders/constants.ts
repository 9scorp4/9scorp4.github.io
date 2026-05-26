/**
 * Shared constants for edge building functions.
 */

import type { CitationType } from '../types.ts';

/** Citation type priority for aggregation: block > text > heading > section */
export const citationPriority: Record<CitationType, number> = {
  block: 4,
  text: 3,
  heading: 2,
  section: 1,
};
