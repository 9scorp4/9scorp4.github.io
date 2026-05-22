#!/usr/bin/env -S npx tsx
/**
 * jardin - Unified CLI for el jardín cibernético
 *
 * Usage:
 *   npx tsx cli/jardin.ts <command> [subcommand] [options]
 *   npm run jardin <command> [subcommand] [options]
 *
 * Commands:
 *   insta      Instagram content generation
 *   buffer     Buffer publishing
 *   visitors   Visitor message management
 *   bonjour    Daily poem management
 *   music      Music metadata enrichment
 *   stats      Garden analytics
 *   help       Show this help
 */

import 'dotenv/config';
import { title, print, muted, cmdExample, divider, blank, error, style } from './lib/cli-style.ts';
import { parseFlags } from './lib/cli-utils.ts';

// Command modules (lazy loaded)
async function runCommand(command: string, args: string[]): Promise<void> {
  switch (command) {
    case 'insta':
    case 'instagram': {
      const { run } = await import('./commands/insta/index.ts');
      await run(args);
      break;
    }

    case 'buffer': {
      const { run } = await import('./commands/buffer/index.ts');
      await run(args);
      break;
    }

    case 'visitors': {
      const { run } = await import('./commands/visitors/index.ts');
      await run(args);
      break;
    }

    case 'bonjour': {
      const { run } = await import('./commands/bonjour/index.ts');
      await run(args);
      break;
    }

    case 'music': {
      const { run } = await import('./commands/music/index.ts');
      await run(args);
      break;
    }

    case 'stats': {
      const { run } = await import('./commands/stats.ts');
      await run(args);
      break;
    }

    case 'refs': {
      const { run } = await import('./commands/refs/index.ts');
      await run(args);
      break;
    }

    case 'help':
    case '-h':
    case '--help':
    case undefined:
      showHelp();
      break;

    default:
      error(`Unknown command: ${command}`);
      print(`Run ${style.command('jardin help')} for available commands.`);
      process.exit(1);
  }
}

function showHelp(): void {
  title('jardin');
  print('Garden CLI for el jardín cibernético\n');

  divider();
  print(style.bold('Commands:\n'));

  print(`  ${style.command('insta')}      Instagram content generation`);
  muted('             generate, batch, profile, intro');
  blank();

  print(`  ${style.command('buffer')}     Buffer publishing`);
  muted('             publish, channels');
  blank();

  print(`  ${style.command('visitors')}   Visitor message management`);
  muted('             list, approve, reject, approve-all, sync');
  blank();

  print(`  ${style.command('bonjour')}    Daily poem management`);
  muted('             generate, list, show, favorite, prune, favorites, prompt');
  blank();

  print(`  ${style.command('music')}      Music metadata enrichment`);
  muted('             enrich');
  blank();

  print(`  ${style.command('stats')}      Garden analytics`);
  muted('             --days=N');
  blank();

  print(`  ${style.command('refs')}       Cross-reference scanner`);
  muted('             scan, --json, --entry=SLUG');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin insta', 'Interactive card generator');
  cmdExample('jardin insta batch --publish', 'Batch generate and publish');
  cmdExample('jardin visitors list', 'List pending messages');
  cmdExample('jardin bonjour generate', 'Generate today\'s poem');
  cmdExample('jardin stats --days=30', 'Show 30-day analytics');
  blank();

  divider();
  print(style.bold('Aliases:\n'));

  print('  npm run insta          → jardin insta generate');
  print('  npm run insta:publish  → jardin insta generate --publish');
  print('  npm run buffer         → jardin buffer publish');
  blank();
}

// Entry point
const [, , command, ...args] = process.argv;

runCommand(command, args).catch((err) => {
  error(err.message || String(err));
  process.exit(1);
});
