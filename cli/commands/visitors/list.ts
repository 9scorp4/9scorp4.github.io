/**
 * List pending visitor messages
 */

import { title, print, muted, blank, error } from '../../lib/cli-style.ts';
import { fetchApi, type VisitorMessage } from './api.ts';

export async function listPending(): Promise<void> {
  title('pending visitor messages');

  try {
    const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

    if (data.messages.length === 0) {
      muted('No pending messages.');
      blank();
      return;
    }

    print(`${data.messages.length} pending message(s):`);
    blank();

    for (const msg of data.messages) {
      print(`${msg.id}`);
      muted(`  ${msg.nombre}: "${msg.mensaje}"`);
      muted(`  ${msg.timestamp}`);
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}
