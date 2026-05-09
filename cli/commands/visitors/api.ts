/**
 * Shared API utilities for visitors commands
 */

import { error } from '../../lib/cli-style.ts';

export interface VisitorMessage {
  id: string;
  nombre: string;
  mensaje: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

const WORKER_URL = process.env.PUBLIC_VISITORS_WORKER_URL;
const ADMIN_TOKEN = process.env.VISITORS_ADMIN_TOKEN;

export function checkEnvVars(): void {
  if (!WORKER_URL || !ADMIN_TOKEN) {
    error('Missing environment variables.');
    console.log('  Set PUBLIC_VISITORS_WORKER_URL and VISITORS_ADMIN_TOKEN in .env');
    process.exit(1);
  }
}

export async function fetchApi(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET'
): Promise<unknown> {
  checkEnvVars();

  const response = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json();
}
