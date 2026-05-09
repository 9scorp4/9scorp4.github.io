/**
 * Instagram command router
 *
 * Subcommands:
 *   generate  Interactive card generator (default)
 *   batch     Non-interactive batch from config
 *   profile   Generate profile picture
 *   intro     Generate intro carousel
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';

export async function run(args: string[]): Promise<void> {
  const [subcommand, ...subArgs] = args;

  // Check for --publish flag at any position
  const hasPublish = args.includes('--publish') || args.includes('-p');
  const filteredArgs = subArgs.filter(a => a !== '--publish' && a !== '-p');

  switch (subcommand) {
    case 'generate':
    case undefined: {
      const { run: runGenerate } = await import('./generate.ts');
      await runGenerate(filteredArgs, hasPublish);
      break;
    }

    case 'batch': {
      const { run: runBatch } = await import('./batch.ts');
      await runBatch(filteredArgs, hasPublish);
      break;
    }

    case 'profile': {
      const { run: runProfile } = await import('./profile.ts');
      await runProfile(filteredArgs);
      break;
    }

    case 'intro': {
      const { run: runIntro } = await import('./intro.ts');
      await runIntro(filteredArgs);
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
  title('jardin insta');
  print('Instagram content generation\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('generate')}   Interactive card generator (default)`);
  muted('             Quote, title, status, specimen cards');
  blank();

  print(`  ${style.command('batch')}      Batch generate from queue`);
  muted('             Generate cards for unpublished entries in batch-queue.yaml');
  blank();

  print(`  ${style.command('profile')}    Generate profile picture`);
  muted('             400x400 mandala on paper background');
  blank();

  print(`  ${style.command('intro')}      Generate intro carousel`);
  muted('             10-slide welcome carousel');
  blank();

  divider();
  print(style.bold('Options:\n'));

  print('  --publish, -p    Enable publishing flow (upload to R2, schedule on Buffer)');
  print('  --dry-run        Preview what would be published (batch only)');
  print('  --last=N         Generate last N unpublished entries (batch only)');
  print('  --all            Generate all unpublished entries (batch only)');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin insta', 'Interactive mode');
  cmdExample('jardin insta generate --publish', 'Generate and publish');
  cmdExample('jardin insta batch', 'List unpublished entries');
  cmdExample('jardin insta batch --last=2', 'Generate last 2 unpublished');
  cmdExample('jardin insta batch --all', 'Generate all unpublished');
  cmdExample('jardin insta batch --last=1 --publish', 'Generate and publish');
  cmdExample('jardin insta batch --dry-run', 'Preview publishing');
  blank();
}
