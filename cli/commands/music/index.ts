/**
 * Music command router
 *
 * Subcommands:
 *   enrich   Fetch BPM/key from API (default)
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';

export async function run(args: string[]): Promise<void> {
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case 'enrich':
    case undefined: {
      const { run: runEnrich } = await import('./enrich.ts');
      await runEnrich(subArgs);
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
  title('jardin music');
  print('Music metadata enrichment\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('enrich')}     Fetch BPM/key from API (default)`);
  muted('             Enriches tracks with songbpmId in ahora');
  blank();

  divider();
  print(style.bold('Options:\n'));

  print('  --dry-run    Preview what would be fetched');
  blank();

  divider();
  print(style.bold('Workflow:\n'));

  print('  1. Find song on getsongbpm.com');
  print('  2. Copy ID from URL (e.g., lOKZLg from /song/warrior-s-dance/lOKZLg)');
  print('  3. Add songbpmId: lOKZLg to track frontmatter');
  print('  4. Run jardin music enrich');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin music', 'Enrich all tracks');
  cmdExample('jardin music enrich --dry-run', 'Preview enrichment');
  blank();
}
