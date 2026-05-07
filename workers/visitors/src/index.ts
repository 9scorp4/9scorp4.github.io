import { SubmissionSchema, type VisitorMessage, type RateLimitEntry } from './schema';
import { sendNotification } from './email';
import { trackEvent, parseEvent, type AnalyticsEngine } from './analytics';
import { composeBonjour } from './bonjour';
import {
  getDailyPoem,
  getDailyPoemWithMeta,
  listRecentPoems,
  listPoemsByVersion,
  prunePoem,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  runDailyCron,
  generatePoem,
  storeDailyPoem,
  getCurrentPromptVersion,
} from './poem';
import { interpolatePrompt, getPromptConfig } from './prompt';

interface Env {
  VISITORS_KV: KVNamespace;
  GARDEN_ANALYTICS?: AnalyticsEngine; // Optional until Analytics Engine is enabled
  ADMIN_TOKEN: string;
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
  GROQ_API_KEY: string;
}

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

async function handleSubmit(request: Request, env: Env): Promise<Response> {
  // Rate limiting by IP
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(clientIp);

  const rateLimitResult = await checkRateLimit(ipHash, env);
  if (!rateLimitResult.allowed) {
    // Track rate-limited submission
    if (env.GARDEN_ANALYTICS) {
      const cfRequest = request as Request & { cf?: { country?: string } };
      const country = cfRequest.cf?.country || 'XX';
      trackEvent(env.GARDEN_ANALYTICS, { type: 'submission', status: 'rate_limited' }, country);
    }
    return json({ error: 'too many notes. wait an hour.' }, 429);
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid request body' }, 400);
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    if (firstError?.path[0] === 'nombre' && firstError.code === 'too_big') {
      return json({ error: 'nombre: 40 chars max.' }, 400);
    }
    if (firstError?.path[0] === 'mensaje' && firstError.code === 'too_big') {
      return json({ error: 'mensaje: 280 chars max. brevity is a gift.' }, 400);
    }
    if (firstError?.path[0] === 'nombre') {
      return json({ error: 'dejar: missing nombre' }, 400);
    }
    if (firstError?.path[0] === 'mensaje') {
      return json({ error: 'dejar: missing mensaje' }, 400);
    }
    return json({ error: 'dejar: missing nombre or mensaje' }, 400);
  }

  // Generate ULID-style ID
  const id = `msg:${generateUlid()}`;
  const timestamp = new Date().toISOString();

  const message: VisitorMessage = {
    id,
    nombre: parsed.data.nombre,
    mensaje: parsed.data.mensaje,
    timestamp,
    status: 'pending',
    ip_hash: ipHash,
  };

  // Store in KV
  await env.VISITORS_KV.put(id, JSON.stringify(message));

  // Increment rate limit counter
  await incrementRateLimit(ipHash, env);

  // Send notification email
  const workerUrl = new URL(request.url).origin;
  await sendNotification(message, env, workerUrl);

  // Track successful submission
  if (env.GARDEN_ANALYTICS) {
    const cfRequest = request as Request & { cf?: { country?: string } };
    const country = cfRequest.cf?.country || 'XX';
    trackEvent(env.GARDEN_ANALYTICS, { type: 'submission', status: 'received' }, country);
  }

  return json({ ok: true, message: 'nota recibida. awaiting approval.' });
}

async function handleTrack(request: Request, env: Env): Promise<Response> {
  // Respect Do Not Track
  const dnt = request.headers.get('DNT');
  if (dnt === '1') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Parse and validate event
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: corsHeaders });
  }

  const event = parseEvent(body);
  if (!event) {
    return new Response(null, { status: 400, headers: corsHeaders });
  }

  // Extract country from Cloudflare headers
  const cfRequest = request as Request & { cf?: { country?: string } };
  const country = cfRequest.cf?.country || 'XX';

  // Write to Analytics Engine (if available)
  if (env.GARDEN_ANALYTICS) {
    trackEvent(env.GARDEN_ANALYTICS, event, country);
  }

  return new Response(null, { status: 204, headers: corsHeaders });
}

async function handleListPending(env: Env): Promise<Response> {
  const messages = await listMessagesByStatus('pending', env);
  return json({ messages });
}

async function handleListApproved(env: Env, url: URL): Promise<Response> {
  const sinceParam = url.searchParams.get('since');
  const messages = await listMessagesByStatus('approved', env);

  // Filter by timestamp if since parameter provided
  const filtered = sinceParam
    ? messages.filter(m => m.timestamp > sinceParam)
    : messages;

  return json({ messages: filtered });
}

async function handleApprove(id: string, env: Env): Promise<Response> {
  const stored = await env.VISITORS_KV.get(id);
  if (!stored) {
    return json({ error: 'message not found' }, 404);
  }

  const message: VisitorMessage = JSON.parse(stored);
  message.status = 'approved';
  await env.VISITORS_KV.put(id, JSON.stringify(message));

  return json({ ok: true, message });
}

async function handleReject(id: string, env: Env): Promise<Response> {
  const stored = await env.VISITORS_KV.get(id);
  if (!stored) {
    return json({ error: 'message not found' }, 404);
  }

  const message: VisitorMessage = JSON.parse(stored);
  message.status = 'rejected';
  await env.VISITORS_KV.put(id, JSON.stringify(message));

  return json({ ok: true, message });
}

// Bonjour handlers

async function handleBonjour(env: Env): Promise<Response> {
  const response = await composeBonjour({ VISITORS_KV: env.VISITORS_KV });
  return json(response);
}

async function handleBonjourGenerate(env: Env): Promise<Response> {
  const result = await generatePoem({ VISITORS_KV: env.VISITORS_KV, GROQ_API_KEY: env.GROQ_API_KEY });
  if (!result) {
    return json({ error: 'poem generation failed' }, 500);
  }
  await storeDailyPoem(env.VISITORS_KV, result);
  return json({
    ok: true,
    poem: result.poem,
    promptVersion: result.promptVersion,
    context: result.context,
  });
}

async function handleBonjourList(env: Env, days: number): Promise<Response> {
  const poems = await listRecentPoems(env.VISITORS_KV, days);
  return json({ poems });
}

async function handleBonjourShow(env: Env, date: string): Promise<Response> {
  const poem = await getDailyPoemWithMeta(env.VISITORS_KV, date);
  if (!poem) {
    return json({ error: 'poem not found' }, 404);
  }
  return json(poem);
}

async function handleBonjourFavorite(env: Env, date: string): Promise<Response> {
  const poem = await getDailyPoem(env.VISITORS_KV, date);
  if (!poem) {
    return json({ error: 'poem not found' }, 404);
  }
  const id = await addToFavorites(env.VISITORS_KV, date, poem);
  return json({ ok: true, id });
}

async function handleBonjourPrune(env: Env, date: string): Promise<Response> {
  const deleted = await prunePoem(env.VISITORS_KV, date);
  if (!deleted) {
    return json({ error: 'poem not found' }, 404);
  }
  return json({ ok: true });
}

async function handleBonjourFavorites(env: Env): Promise<Response> {
  const favorites = await getFavorites(env.VISITORS_KV);
  return json({ favorites });
}

async function handleBonjourRemoveFavorite(env: Env, id: string): Promise<Response> {
  const removed = await removeFromFavorites(env.VISITORS_KV, id);
  if (!removed) {
    return json({ error: 'favorite not found' }, 404);
  }
  return json({ ok: true });
}

async function handleBonjourPrompt(): Promise<Response> {
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

async function handleBonjourPromptTest(): Promise<Response> {
  const result = interpolatePrompt();
  return json({
    version: result.version,
    prompt: result.prompt,
    context: result.context,
  });
}

async function handleBonjourPromptHistory(env: Env, days: number): Promise<Response> {
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

// TODO: N+1 query pattern — fine at current scale, batch if messages exceed ~50
async function listMessagesByStatus(status: string, env: Env): Promise<VisitorMessage[]> {
  const list = await env.VISITORS_KV.list({ prefix: 'msg:' });
  const messages: VisitorMessage[] = [];

  for (const key of list.keys) {
    const stored = await env.VISITORS_KV.get(key.name);
    if (stored) {
      const message: VisitorMessage = JSON.parse(stored);
      if (message.status === status) {
        messages.push(message);
      }
    }
  }

  // Sort by timestamp, newest first
  messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return messages;
}

function checkAuth(request: Request, env: Env): { ok: true } | { ok: false; response: Response } {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, response: json({ error: 'unauthorized' }, 401) };
  }

  const token = authHeader.slice(7);
  if (token !== env.ADMIN_TOKEN) {
    return { ok: false, response: json({ error: 'unauthorized' }, 401) };
  }

  return { ok: true };
}

async function checkRateLimit(ipHash: string, env: Env): Promise<{ allowed: boolean }> {
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

async function incrementRateLimit(ipHash: string, env: Env): Promise<void> {
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

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUlid(): string {
  // Simplified ULID: timestamp + random
  const timestamp = Date.now().toString(36).padStart(10, '0');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(36))
    .join('')
    .slice(0, 16);
  return `${timestamp}${random}`.toUpperCase();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
