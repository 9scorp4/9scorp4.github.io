#!/usr/bin/env npx tsx
/**
 * Sync approved visitor messages from Worker to content collection
 *
 * Called by GitHub Action on schedule or manually via workflow_dispatch.
 * Fetches approved messages and writes YAML files for new ones.
 *
 * Environment:
 *   VISITORS_WORKER_URL - Worker URL
 *   VISITORS_ADMIN_TOKEN - Admin bearer token
 */

import { config } from 'dotenv';
config();

import { readdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';

interface VisitorMessage {
  id: string;
  nombre: string;
  mensaje: string;
  timestamp: string;
}

const WORKER_URL = process.env.VISITORS_WORKER_URL;
const ADMIN_TOKEN = process.env.VISITORS_ADMIN_TOKEN;
const VISITORS_DIR = join(process.cwd(), 'src/content/visitors');

if (!WORKER_URL || !ADMIN_TOKEN) {
  console.error('Missing environment variables.');
  console.error('Set VISITORS_WORKER_URL and VISITORS_ADMIN_TOKEN');
  process.exit(1);
}

async function fetchApproved(): Promise<VisitorMessage[]> {
  const response = await fetch(`${WORKER_URL}/admin/approved`, {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { messages: VisitorMessage[] };
  return data.messages;
}

async function getExistingIds(): Promise<Set<string>> {
  const files = await readdir(VISITORS_DIR).catch(() => []);
  const ids = new Set<string>();

  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      // Read file to extract id
      const content = await readFile(join(VISITORS_DIR, file), 'utf-8');
      const idMatch = content.match(/^id:\s*["']?([^"'\n]+)/m);
      if (idMatch) {
        ids.add(idMatch[1]);
      }
    }
  }

  return ids;
}

function toYaml(msg: VisitorMessage): string {
  // Simple YAML serialization (no special chars expected)
  const escapedNombre = msg.nombre.replace(/"/g, '\\"');
  const escapedMensaje = msg.mensaje.replace(/"/g, '\\"');

  return `id: "${msg.id}"
nombre: "${escapedNombre}"
mensaje: "${escapedMensaje}"
timestamp: "${msg.timestamp}"
`;
}

function idToFilename(id: string): string {
  // msg:ABC123XYZ -> abc123xyz.yaml
  return id.replace('msg:', '').toLowerCase() + '.yaml';
}

async function main(): Promise<void> {
  console.log('Fetching approved messages...');
  const approved = await fetchApproved();
  console.log(`Found ${approved.length} approved message(s)`);

  const existingIds = await getExistingIds();
  console.log(`${existingIds.size} message(s) already synced`);

  const newMessages = approved.filter((m) => !existingIds.has(m.id));

  if (newMessages.length === 0) {
    console.log('No new messages to sync.');
    process.exit(0);
  }

  console.log(`Syncing ${newMessages.length} new message(s)...`);

  for (const msg of newMessages) {
    const filename = idToFilename(msg.id);
    const filepath = join(VISITORS_DIR, filename);
    const yaml = toYaml(msg);

    await writeFile(filepath, yaml, 'utf-8');
    console.log(`  Wrote ${filename}`);
  }

  console.log('Sync complete.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
