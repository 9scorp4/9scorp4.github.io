/**
 * Shared CLI utilities for the jardin CLI.
 */

import { execSync } from 'node:child_process';
import * as yaml from 'yaml';

/** Sentinel value for "go back" option in menus */
export const BACK = Symbol('back');

/**
 * Parse command line flags into a map.
 * Supports: --flag, --key=value, -f
 */
export function parseFlags(args: string[]): {
  flags: Map<string, string | boolean>;
  positional: string[];
} {
  const flags = new Map<string, string | boolean>();
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      if (valueParts.length > 0) {
        flags.set(key, valueParts.join('='));
      } else {
        flags.set(key, true);
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      flags.set(arg.slice(1), true);
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

/**
 * Add a back option to menu choices.
 */
export function withBack<T>(
  choices: Array<{ value: T; name: string }>,
  includeBack = true
): Array<{ value: T | typeof BACK; name: string }> {
  if (!includeBack) return choices;
  return [
    ...choices,
    { value: BACK as unknown as T, name: '← Back' },
  ];
}

/**
 * Parse a date string as local time (avoids UTC timezone shift).
 * "2026-05-04" → May 4 in local timezone, not May 3.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date in en-US locale: "May 7, 2026".
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert a string to a URL-safe slug.
 * Lowercases, replaces non-alphanumeric runs with hyphens, trims edges.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to a maximum length, adding ellipsis if needed.
 */
export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

/**
 * Open a file with the system's default viewer.
 * Cross-platform: uses `open` (macOS), `xdg-open` (Linux), `start` (Windows).
 */
export function openFile(path: string): boolean {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${path}"`);
    } else if (platform === 'linux') {
      execSync(`xdg-open "${path}"`);
    } else if (platform === 'win32') {
      execSync(`start "" "${path}"`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse YAML frontmatter from markdown content.
 */
export function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return yaml.parse(match[1]) as Record<string, unknown>;
}

/**
 * Extract the body content after frontmatter.
 */
export function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

/**
 * Get the project root directory.
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Get the output directory for generated images.
 */
export function getOutputDir(): string {
  return `${getProjectRoot()}/insta-output`;
}

/**
 * Get the source content directory.
 */
export function getContentDir(): string {
  return `${getProjectRoot()}/src/content`;
}

/**
 * Parse --days=N flag from args, defaulting to provided value.
 */
export function parseDaysFlag(args: string[], defaultDays = 7): number {
  const daysArg = args.find(a => a.startsWith('--days='));
  if (!daysArg) return defaultDays;
  const days = parseInt(daysArg.split('=')[1], 10);
  return isNaN(days) ? defaultDays : days;
}
