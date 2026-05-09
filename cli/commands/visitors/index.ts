/**
 * Visitors command router
 *
 * Subcommands:
 *   list         List pending messages (default)
 *   approve      Approve a message
 *   reject       Reject a message
 *   approve-all  Approve all pending messages
 *   sync         Sync approved messages to content collection
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';

export async function run(args: string[]): Promise<void> {
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case 'list':
    case 'pending':
    case undefined: {
      const { listPending } = await import('./list.ts');
      await listPending();
      break;
    }

    case 'approve': {
      const { approveMessage } = await import('./moderate.ts');
      if (!subArgs[0]) {
        error('Usage: jardin visitors approve <message-id>');
        process.exit(1);
      }
      await approveMessage(subArgs[0]);
      break;
    }

    case 'reject': {
      const { rejectMessage } = await import('./moderate.ts');
      if (!subArgs[0]) {
        error('Usage: jardin visitors reject <message-id>');
        process.exit(1);
      }
      await rejectMessage(subArgs[0]);
      break;
    }

    case 'approve-all': {
      const { approveAll } = await import('./moderate.ts');
      await approveAll();
      break;
    }

    case 'sync': {
      const { run: runSync } = await import('./sync.ts');
      await runSync(subArgs);
      break;
    }

    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;

    default:
      error(`Unknown subcommand: ${subcommand}`);
      showHelp();
      process.exit(1);
  }
}

function showHelp(): void {
  title('jardin visitors');
  print('Visitor message management\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('list')}         List pending messages (default)`);
  blank();

  print(`  ${style.command('approve')} <id> Approve a message`);
  blank();

  print(`  ${style.command('reject')} <id>  Reject a message`);
  blank();

  print(`  ${style.command('approve-all')}  Approve all pending messages`);
  blank();

  print(`  ${style.command('sync')}         Sync approved messages to content`);
  muted('               Fetches from worker, writes YAML files');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin visitors', 'List pending');
  cmdExample('jardin visitors approve msg:ABC123', 'Approve a message');
  cmdExample('jardin visitors sync', 'Sync to content/visitors');
  blank();
}
