/**
 * Type definitions for the VisitorsBook console
 */

// Content data passed from Astro at build time
export interface ContentData {
  specimens: {
    id: string;
    name: string;
    grown: string;
    series?: string;
  }[];
  journal: {
    slug: string;
    title: string;
    date: string;
    summary: string;
    language: string;
    type: string;
  }[];
  cultivations: {
    slug: string;
    name: string;
    status: string;
  }[];
  visitors: {
    id: string;
    nombre: string;
    mensaje: string;
    timestamp: string;
  }[];
  workerUrl: string;
}

// Legacy state format (v1)
export interface VisitorStateV1 {
  version: 1;
  visits: number;
  lastVisit: string;
  waterings: number;
  seedPlanted: boolean;
  seedCount: number;
}

// Current state format (v2)
export interface VisitorState {
  version: 2;
  visits: number;
  lastVisit: string;
  waterings: number;
  seedPlanted: boolean;
  seedCount: number;
  stats: {
    pagesViewed: number;
    articlesRead: string[];
    commandsUsed: number;
    secretsFound: string[];
    firstVisit: string;
  };
}

// Context passed to command handlers via dependency injection
export interface CommandContext {
  contentData: ContentData;
  workerUrl: string;
  getVisitorState: () => VisitorState;
  saveVisitorState: (state: VisitorState) => void;
  showOutput: (html: string) => void;
  dismissOutput: () => void;
  showJardinModal: (onDismiss: () => void) => void;
  trackSecretDiscovery: (name: string) => void;
  batesonQuotes: string[];
  setAwaitingConfirmation: (mode: 'olvidar' | null) => void;
  getAwaitingConfirmation: () => 'olvidar' | null;
}

// Raw handler signature (used by command modules)
export type CommandHandler = (args: string, ctx: CommandContext) => void | Promise<void>;

// Wrapped handler signature (stored in registry after context injection)
export type WrappedCommandHandler = (args: string) => void | Promise<void>;

// Command registry stores wrapped handlers
export type CommandRegistry = Record<string, WrappedCommandHandler>;

// Parsed command structure
export interface ParsedCommand {
  name: string;
  args: string;
}
