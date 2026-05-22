/**
 * Refs command router
 *
 * Cross-reference scanner for finding wikilink opportunities.
 *
 * Subcommands:
 *   scan    Scan and report opportunities (default)
 *
 * Flags:
 *   --json              Output as JSON for agent consumption
 *   --entry=SLUG        Focus on single entry (collection:slug)
 *   --min-confidence=N  Minimum confidence threshold (default: 70)
 *   --no-anchors        Exclude anchor-level suggestions
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';
import { parseFlags } from '../../lib/cli-utils.ts';
import type { ScanOptions } from '../../lib/refs-types.ts';

export async function run(args: string[]): Promise<void> {
  const { flags, positional } = parseFlags(args);
  const [subcommand] = positional;

  switch (subcommand) {
    case 'scan':
    case undefined: {
      const { runScan, printResults, printResultsJson } = await import('./scan.ts');

      const minConfStr = flags.get('min-confidence');
      const options: ScanOptions = {
        entry: flags.get('entry') as string | undefined,
        minConfidence: minConfStr ? parseInt(minConfStr as string, 10) : 70,
        includeAnchors: flags.get('no-anchors') !== true,
        json: flags.get('json') === true,
      };

      const result = await runScan(options);

      if (options.json) {
        printResultsJson(result);
      } else {
        printResults(result);
      }
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
  title('jardin refs');
  print('Cross-reference scanner for wikilink opportunities\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('scan')}    Scan and report opportunities (default)`);
  blank();

  divider();
  print(style.bold('Flags:\n'));

  print(`  ${style.command('--json')}              Output as JSON for agent consumption`);
  blank();

  print(`  ${style.command('--entry=SLUG')}        Focus on single entry (e.g., journal:lo-que-no-cruza)`);
  blank();

  print(`  ${style.command('--min-confidence=N')}  Minimum confidence threshold (default: 70)`);
  blank();

  print(`  ${style.command('--no-anchors')}        Exclude anchor-level suggestions`);
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin refs', 'Scan all content');
  cmdExample('jardin refs --json', 'Output JSON for agent');
  cmdExample('jardin refs --entry=journal:lo-que-no-cruza', 'Focus on one entry');
  cmdExample('jardin refs --min-confidence=80', 'Only high-confidence matches');
  blank();

  divider();
  print(style.bold('Match types:\n'));

  print(`  ${style.fern('exact-title')} (95%)      Full title match`);
  print(`  ${style.fern('secondary-title')} (90%)  English title equivalent`);
  print(`  ${style.ochre('anchor')} (75%)           Block anchor term match`);
  blank();

  muted('Tip: Use the wikilink-weaver agent to review and insert links');
  blank();
}
