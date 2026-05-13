import type { AnalyticsEngine } from './analytics';

export interface Env {
  VISITORS_KV: KVNamespace;
  GARDEN_ANALYTICS?: AnalyticsEngine;
  ADMIN_TOKEN: string;
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
  GROQ_API_KEY: string;
}

export type { AnalyticsEngine };
