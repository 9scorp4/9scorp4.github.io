import type { Env } from '../types';
import { SubmissionSchema, type VisitorMessage } from '../schema';
import { trackEvent } from '../analytics';
import { sendNotification } from '../email';
import { json, corsHeaders, hashString, generateUlid, checkRateLimit, incrementRateLimit } from '../lib';

export async function handleSubmit(request: Request, env: Env): Promise<Response> {
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
    const firstError = parsed.error.issues[0];
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

export async function handleTrack(request: Request, env: Env): Promise<Response> {
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

export async function handleListPending(env: Env): Promise<Response> {
  const messages = await listMessagesByStatus('pending', env);
  return json({ messages });
}

export async function handleListApproved(env: Env, url: URL): Promise<Response> {
  const sinceParam = url.searchParams.get('since');
  const messages = await listMessagesByStatus('approved', env);

  // Filter by timestamp if since parameter provided
  const filtered = sinceParam
    ? messages.filter(m => m.timestamp > sinceParam)
    : messages;

  return json({ messages: filtered });
}

export async function handleApprove(id: string, env: Env): Promise<Response> {
  const stored = await env.VISITORS_KV.get(id);
  if (!stored) {
    return json({ error: 'message not found' }, 404);
  }

  const message: VisitorMessage = JSON.parse(stored);
  message.status = 'approved';
  await env.VISITORS_KV.put(id, JSON.stringify(message));

  return json({ ok: true, message });
}

export async function handleReject(id: string, env: Env): Promise<Response> {
  const stored = await env.VISITORS_KV.get(id);
  if (!stored) {
    return json({ error: 'message not found' }, 404);
  }

  const message: VisitorMessage = JSON.parse(stored);
  message.status = 'rejected';
  await env.VISITORS_KV.put(id, JSON.stringify(message));

  return json({ ok: true, message });
}

// Internal helper
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

// Re-import parseEvent since it's used internally
import { parseEvent } from '../analytics';
