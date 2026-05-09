/**
 * Moderation commands: approve, reject, approve-all
 */

import { success, print, muted, blank, error } from '../../lib/cli-style.ts';
import { fetchApi, type VisitorMessage } from './api.ts';

export async function approveMessage(id: string): Promise<void> {
  try {
    const data = (await fetchApi(`/admin/approve/${id}`, 'POST')) as {
      ok: boolean;
      message: VisitorMessage;
    };

    if (data.ok) {
      success(`Approved: ${id}`);
      muted(`  ${data.message.nombre}: "${data.message.mensaje}"`);
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function rejectMessage(id: string): Promise<void> {
  try {
    const data = (await fetchApi(`/admin/reject/${id}`, 'POST')) as {
      ok: boolean;
      message: VisitorMessage;
    };

    if (data.ok) {
      success(`Rejected: ${id}`);
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function approveAll(): Promise<void> {
  try {
    const data = (await fetchApi('/admin/pending')) as { messages: VisitorMessage[] };

    if (data.messages.length === 0) {
      muted('No pending messages to approve.');
      blank();
      return;
    }

    print(`Approving ${data.messages.length} message(s)...`);
    blank();

    for (const msg of data.messages) {
      await approveMessage(msg.id);
    }

    success('All messages approved.');
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}
