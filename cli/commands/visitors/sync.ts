/**
 * Sync approved visitor messages to content collection
 */

import { readdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { title, print, success, muted, blank, error } from '../../lib/cli-style.ts';
import { fetchApi, type VisitorMessage } from './api.ts';
import { getContentDir } from '../../lib/cli-utils.ts';

const VISITORS_DIR = join(getContentDir(), 'visitors');

async function fetchApproved(): Promise<VisitorMessage[]> {
  const data = (await fetchApi('/admin/approved')) as { messages: VisitorMessage[] };
  return data.messages;
}

async function getExistingIds(): Promise<Set<string>> {
  let files: string[];
  try {
    files = await readdir(VISITORS_DIR);
  } catch {
    return new Set();
  }

  const ids = new Set<string>();

  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
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
  const escapedNombre = msg.nombre.replace(/"/g, '\\"');
  const escapedMensaje = msg.mensaje.replace(/"/g, '\\"');

  return `id: "${msg.id}"
nombre: "${escapedNombre}"
mensaje: "${escapedMensaje}"
timestamp: "${msg.timestamp}"
`;
}

function idToFilename(id: string): string {
  return id.replace('msg:', '').toLowerCase() + '.yaml';
}

export async function run(_args: string[]): Promise<void> {
  title('sync visitor messages');

  try {
    print('Fetching approved messages...');
    const approved = await fetchApproved();
    muted(`Found ${approved.length} approved message(s)`);

    const existingIds = await getExistingIds();
    muted(`${existingIds.size} message(s) already synced`);
    blank();

    const newMessages = approved.filter((m) => !existingIds.has(m.id));

    if (newMessages.length === 0) {
      muted('No new messages to sync.');
      blank();
      return;
    }

    print(`Syncing ${newMessages.length} new message(s)...`);
    blank();

    for (const msg of newMessages) {
      const filename = idToFilename(msg.id);
      const filepath = join(VISITORS_DIR, filename);
      const yaml = toYaml(msg);

      await writeFile(filepath, yaml, 'utf-8');
      success(`Wrote ${filename}`);
    }

    blank();
    success('Sync complete.');
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}
