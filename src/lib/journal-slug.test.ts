import { describe, it, expect } from 'vitest';
import {
  extractSlug,
  extractEntryNumber,
  buildFolderName,
  hasPrefixedFormat,
} from './journal-slug.ts';

describe('extractSlug', () => {
  it('extracts slug from prefixed folder name', () => {
    expect(extractSlug('01_lo-que-cruza')).toBe('lo-que-cruza');
    expect(extractSlug('12_al-borde-del-fenomeno')).toBe('al-borde-del-fenomeno');
    expect(extractSlug('99_some-entry')).toBe('some-entry');
  });

  it('returns folder name unchanged when not prefixed', () => {
    expect(extractSlug('lo-que-cruza')).toBe('lo-que-cruza');
    expect(extractSlug('some-entry')).toBe('some-entry');
  });

  it('handles edge cases', () => {
    // Single digit is not a valid prefix
    expect(extractSlug('1_slug')).toBe('1_slug');
    // Three digits is not a valid prefix
    expect(extractSlug('001_slug')).toBe('001_slug');
    // No underscore separator
    expect(extractSlug('01slug')).toBe('01slug');
  });
});

describe('extractEntryNumber', () => {
  it('extracts entry number from prefixed folder name', () => {
    expect(extractEntryNumber('01_lo-que-cruza')).toBe(1);
    expect(extractEntryNumber('12_al-borde-del-fenomeno')).toBe(12);
    expect(extractEntryNumber('99_some-entry')).toBe(99);
  });

  it('returns null for unprefixed folder names', () => {
    expect(extractEntryNumber('lo-que-cruza')).toBeNull();
    expect(extractEntryNumber('some-entry')).toBeNull();
  });

  it('returns null for invalid prefix formats', () => {
    expect(extractEntryNumber('1_slug')).toBeNull();
    expect(extractEntryNumber('001_slug')).toBeNull();
    expect(extractEntryNumber('01slug')).toBeNull();
  });
});

describe('buildFolderName', () => {
  it('builds folder name with zero-padded entry number', () => {
    expect(buildFolderName('lo-que-cruza', 1)).toBe('01_lo-que-cruza');
    expect(buildFolderName('al-borde-del-fenomeno', 12)).toBe('12_al-borde-del-fenomeno');
    expect(buildFolderName('some-entry', 99)).toBe('99_some-entry');
  });

  it('handles single-digit entry numbers', () => {
    expect(buildFolderName('test', 5)).toBe('05_test');
    expect(buildFolderName('test', 9)).toBe('09_test');
  });
});

describe('hasPrefixedFormat', () => {
  it('returns true for prefixed folder names', () => {
    expect(hasPrefixedFormat('01_lo-que-cruza')).toBe(true);
    expect(hasPrefixedFormat('12_some-entry')).toBe(true);
  });

  it('returns false for unprefixed folder names', () => {
    expect(hasPrefixedFormat('lo-que-cruza')).toBe(false);
    expect(hasPrefixedFormat('some-entry')).toBe(false);
  });

  it('returns false for invalid prefix formats', () => {
    expect(hasPrefixedFormat('1_slug')).toBe(false);
    expect(hasPrefixedFormat('001_slug')).toBe(false);
  });
});
