import { SubmissionSchema, type VisitorMessage, type RateLimitEntry } from './schema';
import { sendNotification } from './email';

interface Env {
  VISITORS_KV: KVNamespace;
  ADMIN_TOKEN: string;
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
}

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
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

  return json({ ok: true, message: 'nota recibida. awaiting approval.' });
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
