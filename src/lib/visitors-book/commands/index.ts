/**
 * Command registry builder
 */

import type { CommandHandler, CommandRegistry, CommandContext } from '../types';
import { navigationCommands } from './navigation';
import { secretsCommands } from './secrets';
import { visitorsCommands } from './visitors';
import { metaCommands } from './meta';

/**
 * Build the complete command registry with injected context
 */
export function buildCommandRegistry(ctx: CommandContext): CommandRegistry {
  const registry: CommandRegistry = {};

  // Wrap handlers to inject context
  function register(commands: Record<string, CommandHandler>): void {
    for (const [name, handler] of Object.entries(commands)) {
      registry[name] = (args: string) => handler(args, ctx);
    }
  }

  register(navigationCommands);
  register(secretsCommands);
  register(visitorsCommands);
  register(metaCommands);

  return registry;
}

/**
 * Parse command input into name and args
 */
export function parseCommand(input: string): { name: string; args: string } {
  const trimmed = input.trim().toLowerCase();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { name: trimmed, args: '' };
  }
  return {
    name: trimmed.slice(0, spaceIndex),
    args: trimmed.slice(spaceIndex + 1).trim(),
  };
}

export type { CommandHandler, CommandRegistry, CommandContext };
