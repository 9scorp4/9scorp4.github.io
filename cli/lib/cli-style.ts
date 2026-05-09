/**
 * Terminal styling utilities for the jardin CLI.
 * Uses chalk with garden palette colors, respects NO_COLOR.
 */

import chalk from 'chalk';

// Garden palette (from PALETTE.md)
export const palette = {
  fern: '#2d5a3d',      // Success, actions
  ochre: '#c08820',     // Commands, warnings
  terracotta: '#a8472a', // Errors
  magenta: '#c93f7a',   // Title highlights (sparingly)
  ink: '#3c3228',       // Primary text
  inkSoft: '#5c5548',   // Secondary text
  inkFaint: '#8c8578',  // Muted text
  paper: '#f7f3eb',     // Background
  sun: '#e8a02a',       // Accent
};

// Check NO_COLOR environment variable
const noColor = process.env.NO_COLOR !== undefined;

/**
 * Create a chalk instance that respects NO_COLOR.
 */
function colorize(color: string) {
  return noColor ? (text: string) => text : chalk.hex(color);
}

// Styled text functions
export const style = {
  // Colors
  fern: colorize(palette.fern),
  ochre: colorize(palette.ochre),
  terracotta: colorize(palette.terracotta),
  magenta: colorize(palette.magenta),
  ink: colorize(palette.ink),
  inkSoft: colorize(palette.inkSoft),
  inkFaint: colorize(palette.inkFaint),
  sun: colorize(palette.sun),

  // Semantic styles
  success: colorize(palette.fern),
  warning: colorize(palette.ochre),
  error: colorize(palette.terracotta),
  command: colorize(palette.ochre),
  highlight: colorize(palette.magenta),
  muted: colorize(palette.inkFaint),

  // Bold variants
  bold: noColor ? (text: string) => text : chalk.bold,
  dim: noColor ? (text: string) => text : chalk.dim,
};

// Unicode symbols
export const symbols = {
  title: '✦',       // Section titles
  success: '✓',     // Success messages
  error: '✕',       // Error messages
  warning: '!',     // Warnings
  divider: '─',     // Horizontal dividers
  bullet: '•',      // List bullets
  arrow: '→',       // Arrows
  back: '←',        // Back arrow

  // Status markers (matching garden metaphor)
  growing: '▲',     // Active/growing
  dormant: '◐',     // Dormant/paused
  wild: '○',        // Wild/unstructured
  composted: '✕',   // Composted/archived
};

/**
 * Print a styled section title.
 */
export function title(text: string): void {
  console.log(`\n  ${style.highlight(symbols.title)} ${style.bold(text)}\n`);
}

/**
 * Print a success message.
 */
export function success(text: string): void {
  console.log(`  ${style.success(symbols.success)} ${text}`);
}

/**
 * Print an error message.
 */
export function error(text: string): void {
  console.log(`  ${style.error(symbols.error)} ${text}`);
}

/**
 * Print a warning message.
 */
export function warning(text: string): void {
  console.log(`  ${style.warning(symbols.warning)} ${text}`);
}

/**
 * Print a horizontal divider.
 */
export function divider(length = 50): void {
  console.log(`  ${style.muted(symbols.divider.repeat(length))}`);
}

/**
 * Print a bullet point item.
 */
export function bullet(text: string): void {
  console.log(`  ${symbols.bullet} ${text}`);
}

/**
 * Print a command example.
 */
export function cmdExample(cmd: string, description?: string): void {
  const desc = description ? style.muted(` - ${description}`) : '';
  console.log(`  ${style.command(cmd)}${desc}`);
}

/**
 * Print a key-value pair.
 */
export function keyValue(key: string, value: string): void {
  console.log(`  ${style.muted(key)}: ${value}`);
}

/**
 * Print plain text with standard indentation.
 */
export function print(text: string): void {
  console.log(`  ${text}`);
}

/**
 * Print muted text.
 */
export function muted(text: string): void {
  console.log(`  ${style.muted(text)}`);
}

/**
 * Print an empty line.
 */
export function blank(): void {
  console.log('');
}
