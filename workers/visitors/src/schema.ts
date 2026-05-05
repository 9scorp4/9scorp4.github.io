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
