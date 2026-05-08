import { z } from 'zod';

export const SubmissionSchema = z.object({
  nombre: z.string().min(1).max(40),
  mensaje: z.string().min(1).max(280),
});

export type Submission = z.infer<typeof SubmissionSchema>;

export interface VisitorMessage {
  id: string;
  nombre: string;
  mensaje: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  ip_hash: string;
}

export interface RateLimitEntry {
  count: number;
  window_start: number;
}

// Poem rating schema
export const RatingSchema = z.object({
  poemHash: z.string().length(12),
  rating: z.enum(['bien', 'bof', 'nul']),
});

export type Rating = z.infer<typeof RatingSchema>;

export interface PoemRatings {
  poemText: string;
  ratings: { bien: number; bof: number; nul: number };
  raters: string[];  // IP hashes (rate limit)
  firstRated: string;
  lastRated: string;
  source: 'daily' | 'favorite';
  sourceDate?: string;
}
