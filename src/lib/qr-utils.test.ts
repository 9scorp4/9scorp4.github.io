import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getContentUrl } from './qr-utils.ts';

describe('getContentUrl', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.SITE_URL;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.SITE_URL;
  });

  afterEach(() => {
    warnSpy.mockRestore();
    if (originalEnv) {
      process.env.SITE_URL = originalEnv;
    } else {
      delete process.env.SITE_URL;
    }
  });

  describe('quote template', () => {
    it('returns journal article URL with slug', () => {
      const url = getContentUrl('quote', { slug: 'my-article' } as any);
      expect(url).toBe('https://9scorp4.github.io/cuaderno/my-article');
    });

    it('falls back to #journal when no slug', () => {
      const url = getContentUrl('quote', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#journal');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('title template', () => {
    it('returns journal article URL with slug', () => {
      const url = getContentUrl('title', { slug: 'another-article' } as any);
      expect(url).toBe('https://9scorp4.github.io/cuaderno/another-article');
    });

    it('falls back to #journal when no slug', () => {
      const url = getContentUrl('title', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#journal');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('status template', () => {
    it('returns #now section URL', () => {
      const url = getContentUrl('status', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#now');
    });
  });

  describe('specimen template', () => {
    it('returns specimen anchor URL with id', () => {
      const url = getContentUrl('specimen', { id: 'particle-flow' } as any);
      expect(url).toBe('https://9scorp4.github.io/#particle-flow');
    });

    it('falls back to #conservatory when no id', () => {
      const url = getContentUrl('specimen', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#conservatory');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('metalogue template', () => {
    it('returns article URL with #metalogue fragment', () => {
      const url = getContentUrl('metalogue', { slug: 'diptych-entry' } as any);
      expect(url).toBe('https://9scorp4.github.io/cuaderno/diptych-entry#metalogue');
    });

    it('falls back to #journal when no slug', () => {
      const url = getContentUrl('metalogue', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#journal');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('intro template', () => {
    it('returns base URL', () => {
      const url = getContentUrl('intro', {} as any);
      expect(url).toBe('https://9scorp4.github.io');
    });
  });

  describe('base URL handling', () => {
    it('uses provided baseUrl parameter', () => {
      const url = getContentUrl('status', {} as any, 'https://custom.domain.com');
      expect(url).toBe('https://custom.domain.com/#now');
    });

    it('uses SITE_URL environment variable when set', () => {
      process.env.SITE_URL = 'https://env.domain.com';
      const url = getContentUrl('status', {} as any);
      expect(url).toBe('https://env.domain.com/#now');
    });

    it('prefers baseUrl parameter over environment variable', () => {
      process.env.SITE_URL = 'https://env.domain.com';
      const url = getContentUrl('status', {} as any, 'https://param.domain.com');
      expect(url).toBe('https://param.domain.com/#now');
    });

    it('defaults to production URL when no baseUrl or env var', () => {
      const url = getContentUrl('status', {} as any);
      expect(url).toBe('https://9scorp4.github.io/#now');
    });
  });
});
