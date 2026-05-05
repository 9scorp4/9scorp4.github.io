#!/usr/bin/env npx tsx
/**
 * Admin CLI for managing visitor messages
 *
 * Usage:
 *   npx tsx scripts/visitors-admin.ts list
 *   npx tsx scripts/visitors-admin.ts approve msg:01HXY...
 *   npx tsx scripts/visitors-admin.ts reject msg:01HXY...
 *   npx tsx scripts/visitors-admin.ts approve-all
 *
 * Environment:
 *   VISITORS_WORKER_URL - Worker URL (e.g., https://visitors.xxx.workers.dev)
 *   VISITORS_ADMIN_TOKEN - Admin bearer token
 */

import { config } from 'dotenv';
config();

interface VisitorMessage {
  id: string;
  nombre: string;
  mensaje: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

const WORKER_URL = process.env.VISITORS_WORKER_URL;
const ADMIN_TOKEN = process.env.VISITORS_ADMIN_TOKEN;

if (!WORKER_URL || !ADMIN_TOKEN) {
  console.error('Missing environment variables.');
  console.error('Set VISITORS_WORKER_URL and VISITORS_ADMIN_TOKEN in .env');
  process.exit(1);
}

async function fetchApi(
  path: string,
  method: 'GET' | 'POST' = 'GET'
): Promise<unknown> {
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

async function listPending(): Promise<void> {
  const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

  if (data.messages.length === 0) {
    console.log('No pending messages.');
    return;
  }

  console.log(`\n${data.messages.length} pending message(s):\n`);
  for (const msg of data.messages) {
    console.log(`  ${msg.id}`);
    console.log(`  ${msg.nombre}: "${msg.mensaje}"`);
    console.log(`  ${msg.timestamp}`);
    console.log('');
  }
}

async function approveMessage(id: string): Promise<void> {
  const data = (await fetchApi(`/admin/approve/${id}`, 'POST')) as {
    ok: boolean;
    message: VisitorMessage;
  };

  if (data.ok) {
    console.log(`Approved: ${id}`);
    console.log(`  ${data.message.nombre}: "${data.message.mensaje}"`);
  }
}

async function rejectMessage(id: string): Promise<void> {
  const data = (await fetchApi(`/admin/reject/${id}`, 'POST')) as {
    ok: boolean;
    message: VisitorMessage;
  };

  if (data.ok) {
    console.log(`Rejected: ${id}`);
  }
}

async function approveAll(): Promise<void> {
  const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

  if (data.messages.length === 0) {
    console.log('No pending messages to approve.');
    return;
  }

  console.log(`Approving ${data.messages.length} message(s)...`);

  for (const msg of data.messages) {
    await approveMessage(msg.id);
  }

  console.log('\nAll messages approved.');
}

// CLI entry point
const [, , command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'list':
    case 'pending':
      await listPending();
      break;

    case 'approve':
      if (!args[0]) {
        console.error('Usage: approve <message-id>');
        process.exit(1);
      }
      await approveMessage(args[0]);
      break;

    case 'reject':
      if (!args[0]) {
        console.error('Usage: reject <message-id>');
        process.exit(1);
      }
      await rejectMessage(args[0]);
      break;

    case 'approve-all':
      await approveAll();
      break;

    default:
      console.log('Visitors Admin CLI');
      console.log('');
      console.log('Commands:');
      console.log('  list          List pending messages');
      console.log('  approve <id>  Approve a message');
      console.log('  reject <id>   Reject a message');
      console.log('  approve-all   Approve all pending messages');
      break;
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
