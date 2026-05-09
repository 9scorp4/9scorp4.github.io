/**
 * Buffer command router
 *
 * Subcommands:
 *   publish    Interactive publish (default)
 *   channels   List connected channels
 */

import { title, print, muted, cmdExample, divider, blank, error, style } from '../../lib/cli-style.ts';

export async function run(args: string[]): Promise<void> {
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case 'publish':
    case undefined: {
      const { run: runPublish } = await import('./publish.ts');
      await runPublish(subArgs);
      break;
    }

    case 'channels': {
      const { run: runChannels } = await import('./channels.ts');
      await runChannels(subArgs);
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
  title('jardin buffer');
  print('Buffer publishing\n');

  divider();
  print(style.bold('Subcommands:\n'));

  print(`  ${style.command('publish')}    Interactive image publishing (default)`);
  muted('             Browse and publish from insta-output/');
  blank();

  print(`  ${style.command('channels')}   List connected Buffer channels`);
  muted('             Show channel IDs for configuration');
  blank();

  divider();
  print(style.bold('Examples:\n'));

  cmdExample('jardin buffer', 'Interactive publish mode');
  cmdExample('jardin buffer channels', 'List channels');
  cmdExample('jardin buffer publish path/to/image.png', 'Publish specific image');
  blank();
}
