/**
 * VisitorsBook module - Interactive CLI console for the garden
 *
 * Parser-flavored, terse responses. Occasionally quotes Bateson.
 * Tracks visitor state in localStorage.
 */

// Types
export type {
  ContentData,
  VisitorState,
  VisitorStateV1,
  CommandContext,
  CommandHandler,
  CommandRegistry,
  ParsedCommand,
} from './types';

// State management
export {
  createDefaultState,
  migrateState,
  getVisitorState,
  saveVisitorState,
  clearVisitorState,
} from './state';

// Secrets registry
export {
  secretCommands,
  secretDescriptions,
  TOTAL_SECRETS,
} from './secrets';

// Utilities
export { getSeason } from './season';
export { looksLikeProse, escapeHtml } from './prose-detection';
export { trackCommand, trackSecretDiscovery } from './tracking';
export { createOutputManager } from './output';
export { createTypingAnimation } from './typing-animation';

// Commands
export { buildCommandRegistry, parseCommand } from './commands';

// Input handling
export { createCursorManager, bindInputHandlers } from './input-handler';
export type { InputRefs, InputCallbacks } from './input-handler';

// Command execution
export { createCommandExecutor } from './command-executor';
export type { ExecutorDeps, ExecutorState } from './command-executor';

// Rating handler
export { bindRatingHandler } from './rating-handler';

// URL hash handling
export { initDejarHash } from './dejar-hash';
export type { DejarHashContext } from './dejar-hash';
