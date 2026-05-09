/**
 * Buffer channels command
 *
 * List connected Buffer channels and their IDs.
 */

import { getChannels } from '../../../src/lib/buffer-client.ts';
import { title, print, success, error, muted, blank } from '../../lib/cli-style.ts';

export async function run(_args: string[]): Promise<void> {
  title('connected buffer channels');

  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    error('BUFFER_API_KEY not set in .env');
    blank();
    return;
  }

  try {
    const channels = await getChannels(apiKey);

    if (channels.length === 0) {
      muted('No channels connected.');
      print('Connect Instagram at buffer.com/channels');
      blank();
      return;
    }

    print('Channels:');
    blank();
    for (const ch of channels) {
      const tag = ch.service === 'instagram' ? ' ← use this ID' : '';
      print(`  ${ch.service.padEnd(12)} ${ch.name.padEnd(20)} ${ch.id}${tag}`);
    }
    blank();
    print('Set BUFFER_CHANNEL_ID in .env to your Instagram channel ID.');
    blank();
  } catch (err) {
    error((err as Error).message);
    blank();
  }
}
