/**
 * Command execution logic for the VisitorsBook console.
 * Handles command dispatch and confirmation modes.
 */

import type { VisitorState, CommandRegistry } from './types';
import { parseCommand } from './commands';
import { looksLikeProse } from './prose-detection';
import { trackCommand, trackSecretDiscovery } from './tracking';
import { createDefaultState, clearVisitorState } from './state';

export interface ExecutorDeps {
  commands: CommandRegistry;
  workerUrl: string;
  getVisitorState: () => VisitorState;
  saveVisitorState: (state: VisitorState) => void;
  showOutput: (html: string) => void;
  dismissOutput: () => void;
}

export interface ExecutorState {
  awaitingConfirmation: 'olvidar' | null;
}

/** Create command executor with confirmation mode support */
export function createCommandExecutor(deps: ExecutorDeps): {
  execute: (rawInput: string) => void;
  setAwaitingConfirmation: (mode: 'olvidar' | null) => void;
  getAwaitingConfirmation: () => 'olvidar' | null;
} {
  const { commands, workerUrl, getVisitorState, saveVisitorState, showOutput, dismissOutput } = deps;

  const state: ExecutorState = {
    awaitingConfirmation: null,
  };

  function execute(rawInput: string): void {
    const trimmed = rawInput.trim().toLowerCase();
    let visitorState = getVisitorState();

    // Handle confirmation mode for olvidar/forget
    if (state.awaitingConfirmation === 'olvidar') {
      state.awaitingConfirmation = null;
      if (trimmed === 'y' || trimmed === 'yes' || trimmed === 'sí' || trimmed === 'si') {
        clearVisitorState();
        saveVisitorState(createDefaultState());
        showOutput('<p class="output-line output-muted">the garden has forgotten you. it will remember again.</p>');
      } else {
        showOutput('<p class="output-line output-muted">recordando.</p>');
      }
      return;
    }

    const { name, args } = parseCommand(rawInput);

    if (!name) {
      dismissOutput();
      return;
    }

    const handler = commands[name];
    if (handler) {
      trackCommand(name, workerUrl);
      visitorState.stats.commandsUsed++;
      trackSecretDiscovery(name, visitorState, saveVisitorState);
      saveVisitorState(visitorState);
      handler(args);
    } else {
      if (looksLikeProse(rawInput)) {
        showOutput('<p class="output-line output-muted">parece una nota — prueba <span class="output-mono">dejar</span></p>');
      } else {
        showOutput(`<p class="output-line output-muted">unknown command: ${name}</p>`);
      }
    }
  }

  return {
    execute,
    setAwaitingConfirmation: (mode: 'olvidar' | null) => {
      state.awaitingConfirmation = mode;
    },
    getAwaitingConfirmation: () => state.awaitingConfirmation,
  };
}
