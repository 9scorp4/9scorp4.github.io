import { runDailyCron } from './poem';
import { corsHeaders, json, checkAuth } from './lib';
import {
  handleSubmit,
  handleTrack,
  handleListPending,
  handleListApproved,
  handleApprove,
  handleReject,
  handleBonjour,
  handleBonjourRate,
  handleBonjourGenerate,
  handleBonjourList,
  handleBonjourShow,
  handleBonjourFavorite,
  handleBonjourPrune,
  handleBonjourFavorites,
  handleBonjourRemoveFavorite,
  handleBonjourPrompt,
  handleBonjourPromptTest,
  handleBonjourPromptHistory,
} from './handlers';

import type { Env } from './types';
export type { Env };

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await env.VISITORS_KV.get(`bonjour:daily:${today}`);
    if (existing) return; // DST workaround: no-op if exists
    await runDailyCron({ VISITORS_KV: env.VISITORS_KV, GROQ_API_KEY: env.GROQ_API_KEY });
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (path === '/submit' && request.method === 'POST') {
      return handleSubmit(request, env);
    }

    if (path === '/track' && request.method === 'POST') {
      return handleTrack(request, env);
    }

    // Bonjour: public endpoint
    if (path === '/bonjour' && request.method === 'GET') {
      return handleBonjour(env);
    }

    // Bonjour rate: public endpoint
    if (path === '/bonjour/rate' && request.method === 'POST') {
      return handleBonjourRate(request, env);
    }

    // Admin routes - require auth
    if (path.startsWith('/admin/')) {
      const authResult = checkAuth(request, env);
      if (!authResult.ok) {
        return authResult.response;
      }

      if (path === '/admin/pending' && request.method === 'GET') {
        return handleListPending(env);
      }

      if (path === '/admin/approved' && request.method === 'GET') {
        return handleListApproved(env, url);
      }

      const approveMatch = path.match(/^\/admin\/approve\/(.+)$/);
      if (approveMatch && request.method === 'POST') {
        return handleApprove(approveMatch[1], env);
      }

      const rejectMatch = path.match(/^\/admin\/reject\/(.+)$/);
      if (rejectMatch && request.method === 'POST') {
        return handleReject(rejectMatch[1], env);
      }

      // Bonjour admin routes
      if (path === '/admin/bonjour/generate' && request.method === 'POST') {
        return handleBonjourGenerate(env);
      }

      if (path === '/admin/bonjour/list' && request.method === 'GET') {
        const daysParam = url.searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 7;
        return handleBonjourList(env, isNaN(days) ? 7 : days);
      }

      const showMatch = path.match(/^\/admin\/bonjour\/show\/(\d{4}-\d{2}-\d{2})$/);
      if (showMatch && request.method === 'GET') {
        return handleBonjourShow(env, showMatch[1]);
      }

      const favoriteMatch = path.match(/^\/admin\/bonjour\/favorite\/(\d{4}-\d{2}-\d{2})$/);
      if (favoriteMatch && request.method === 'POST') {
        return handleBonjourFavorite(env, favoriteMatch[1]);
      }

      const pruneMatch = path.match(/^\/admin\/bonjour\/prune\/(\d{4}-\d{2}-\d{2})$/);
      if (pruneMatch && request.method === 'DELETE') {
        return handleBonjourPrune(env, pruneMatch[1]);
      }

      if (path === '/admin/bonjour/favorites' && request.method === 'GET') {
        return handleBonjourFavorites(env);
      }

      const removeFavoriteMatch = path.match(/^\/admin\/bonjour\/favorites\/(.+)$/);
      if (removeFavoriteMatch && request.method === 'DELETE') {
        return handleBonjourRemoveFavorite(env, removeFavoriteMatch[1]);
      }

      // Prompt admin routes
      if (path === '/admin/bonjour/prompt' && request.method === 'GET') {
        return handleBonjourPrompt();
      }

      if (path === '/admin/bonjour/prompt/test' && request.method === 'POST') {
        return handleBonjourPromptTest();
      }

      if (path === '/admin/bonjour/prompt/history' && request.method === 'GET') {
        const daysParam = url.searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        return handleBonjourPromptHistory(env, isNaN(days) ? 30 : days);
      }
    }

    return json({ error: 'not found' }, 404);
  },
};
