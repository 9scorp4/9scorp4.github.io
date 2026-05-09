/**
 * Bonjour command router
 *
 * Subcommands:
 *   generate     Generate today's poem
 *   list         List recent poems
 *   show         Show poem for a date
 *   favorite     Add poem to favorites
 *   prune        Delete poem for a date
 *   favorites    List/manage favorites
 *   prompt       Prompt configuration
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';
import { parseDaysFlag } from '../../lib/cli-utils.ts';

export async function run(args: string[]): Promise<void> {
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case 'generate': {
      const { bonjourGenerate } = await import('./commands.ts');
      await bonjourGenerate();
      break;
    }

    case 'list': {
      const { bonjourList } = await import('./commands.ts');
      const days = parseDaysFlag(subArgs, 7);
      await bonjourList(days);
      break;
    }

    case 'show': {
      const { bonjourShow } = await import('./commands.ts');
      const dateArg = subArgs.find(a => !a.startsWith('--'));
      if (!dateArg) {
        error('Usage: jardin bonjour show YYYY-MM-DD');
        process.exit(1);
      }
      await bonjourShow(dateArg);
      break;
    }

    case 'favorite': {
      const { bonjourFavorite } = await import('./commands.ts');
      if (!subArgs[0]) {
        error('Usage: jardin bonjour favorite YYYY-MM-DD');
        process.exit(1);
      }
      await bonjourFavorite(subArgs[0]);
      break;
    }

    case 'prune': {
      const { bonjourPrune } = await import('./commands.ts');
      if (!subArgs[0]) {
        error('Usage: jardin bonjour prune YYYY-MM-DD');
        process.exit(1);
      }
      await bonjourPrune(subArgs[0]);
      break;
    }

    case 'favorites': {
      const { bonjourFavoritesList, bonjourFavoritesRemove } = await import('./commands.ts');
      if (subArgs[0] === 'remove') {
        if (!subArgs[1]) {
          error('Usage: jardin bonjour favorites remove <id>');
          process.exit(1);
        }
        await bonjourFavoritesRemove(subArgs[1]);
      } else {
        await bonjourFavoritesList();
      }
      break;
    }

    case 'prompt': {
      const { bonjourPromptInfo, bonjourPromptTest, bonjourPromptHistory } = await import('./commands.ts');
      if (subArgs[0] === 'test') {
        await bonjourPromptTest();
      } else if (subArgs[0] === 'history') {
        const days = parseDaysFlag(subArgs.slice(1), 30);
        await bonjourPromptHistory(days);
      } else {
        await bonjourPromptInfo();
      }
      break;
    }

    case 'help':
    case '-h':
    case '--help':
    case undefined:
      showHelp();
      break;

    default:
      error(`Unknown subcommand: ${subcommand}`);
      showHelp();
      process.exit(1);
  }
}

function showHelp(): void {
  title('jardin bonjour');
  print('Daily poem management\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('generate')}              Generate today's poem`);
  blank();

  print(`  ${style.command('list')} [--days=N]       List recent poems (default: 7 days)`);
  blank();

  print(`  ${style.command('show')} YYYY-MM-DD       Show poem for a specific date`);
  blank();

  print(`  ${style.command('favorite')} YYYY-MM-DD   Add poem to favorites`);
  blank();

  print(`  ${style.command('prune')} YYYY-MM-DD      Delete poem for a date`);
  blank();

  print(`  ${style.command('favorites')}             List favorite poems`);
  muted('    favorites remove <id>  Remove a favorite');
  blank();

  print(`  ${style.command('prompt')}                Show prompt configuration`);
  muted('    prompt test            Test prompt interpolation');
  muted('    prompt history         Show poems by version [--days=N]');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin bonjour generate', 'Generate today\'s poem');
  cmdExample('jardin bonjour list --days=14', 'List poems from last 2 weeks');
  cmdExample('jardin bonjour show 2026-05-07', 'Show specific poem');
  blank();
}
