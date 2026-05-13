import type { Env } from '../types';
import { json } from './response';

export function checkAuth(request: Request, env: Env): { ok: true } | { ok: false; response: Response } {
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
