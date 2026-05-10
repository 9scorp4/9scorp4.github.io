import { describe, it, expect } from 'vitest';
import {
  generateCaption,
  createPostMetadata,
  type QuoteMetadata,
  type TitleMetadata,
  type StatusMetadata,
  type SpecimenMetadata,
  type IntroMetadata,
  type MetalogueMetadata,
} from './insta-captions.ts';

describe('generateCaption', () => {
  describe('quote template', () => {
    it('generates quote caption with source', () => {
      const meta: QuoteMetadata = {
        quote: 'The map is not the territory.',
        sourceTitle: 'Science and Sanity',
        date: new Date(2026, 4, 7),
      };
      const { caption } = generateCaption('quote', meta);
      expect(caption).toContain('"The map is not the territory."');
      expect(caption).toContain('— Science and Sanity');
    });

    it('truncates very long quotes', () => {
      const longQuote = 'A'.repeat(250);
      const meta: QuoteMetadata = {
        quote: longQuote,
        sourceTitle: 'Test',
        date: new Date(2026, 4, 7),
      };
      const { caption } = generateCaption('quote', meta);
      expect(caption.length).toBeLessThan(longQuote.length + 50);
      expect(caption).toContain('...');
    });

    it('includes quote hashtags', () => {
      const meta: QuoteMetadata = {
        quote: 'Test',
        sourceTitle: 'Test',
        date: new Date(2026, 4, 7),
      };
      const { hashtags } = generateCaption('quote', meta);
      expect(hashtags).toContain('#escritura');
      expect(hashtags).toContain('#writing');
      expect(hashtags).toContain('#fragmentos');
      expect(hashtags).toContain('#cuadernodecampo');
    });
  });

  describe('title template', () => {
    it('generates title caption', () => {
      const meta: TitleMetadata = {
        title: 'Lo que corrige el mapa',
        date: new Date(2026, 4, 7),
      };
      const { caption } = generateCaption('title', meta);
      expect(caption).toBe('nuevo en el jardín: Lo que corrige el mapa');
    });

    it('includes secondary title when provided', () => {
      const meta: TitleMetadata = {
        title: 'Main Title',
        titleSecondary: 'Subtitle here',
        date: new Date(2026, 4, 7),
      };
      const { caption } = generateCaption('title', meta);
      expect(caption).toContain('Main Title');
      expect(caption).toContain('Subtitle here');
    });

    it('adds diptych marker when isDiptych is true', () => {
      const meta: TitleMetadata = {
        title: 'A Diptych Entry',
        date: new Date(2026, 4, 7),
        isDiptych: true,
      };
      const { caption } = generateCaption('title', meta);
      expect(caption).toContain('[diptych]');
    });

    it('includes title hashtags', () => {
      const meta: TitleMetadata = {
        title: 'Test',
        date: new Date(2026, 4, 7),
      };
      const { hashtags } = generateCaption('title', meta);
      expect(hashtags).toContain('#nuevopost');
      expect(hashtags).toContain('#newpost');
      expect(hashtags).toContain('#jardincibernetico');
    });
  });

  describe('status template', () => {
    it('generates status caption with Spanish date', () => {
      const meta: StatusMetadata = {
        date: new Date(2026, 4, 7), // May 7, 2026
      };
      const { caption } = generateCaption('status', meta);
      expect(caption).toContain('el ahora');
      // Spanish date format: "7 de mayo de 2026"
      expect(caption).toMatch(/mayo/i);
      expect(caption).toMatch(/2026/);
    });

    it('includes status hashtags', () => {
      const meta: StatusMetadata = {
        date: new Date(2026, 4, 7),
      };
      const { hashtags } = generateCaption('status', meta);
      expect(hashtags).toContain('#elahora');
      expect(hashtags).toContain('#thenow');
      expect(hashtags).toContain('#maintenant');
    });
  });

  describe('specimen template', () => {
    it('generates specimen caption with status label', () => {
      const meta: SpecimenMetadata = {
        name: 'Particle Flow',
        status: 'growing',
        description: 'A generative sketch',
      };
      const { caption } = generateCaption('specimen', meta);
      expect(caption).toBe('Particle Flow [creciendo]');
    });

    it('uses correct status labels', () => {
      const statuses: Array<{ status: SpecimenMetadata['status']; label: string }> = [
        { status: 'growing', label: 'creciendo' },
        { status: 'dormant', label: 'dormant' },
        { status: 'wild', label: 'silvestre' },
        { status: 'composted', label: 'compostado' },
      ];

      for (const { status, label } of statuses) {
        const meta: SpecimenMetadata = {
          name: 'Test',
          status,
          description: 'desc',
        };
        const { caption } = generateCaption('specimen', meta);
        expect(caption).toContain(`[${label}]`);
      }
    });

    it('includes specimen hashtags', () => {
      const meta: SpecimenMetadata = {
        name: 'Test',
        status: 'growing',
        description: 'desc',
      };
      const { hashtags } = generateCaption('specimen', meta);
      expect(hashtags).toContain('#creativecoding');
      expect(hashtags).toContain('#generativeart');
      expect(hashtags).toContain('#p5js');
    });

    it('adds series hashtag when provided', () => {
      const meta: SpecimenMetadata = {
        name: 'Test',
        status: 'growing',
        description: 'desc',
        series: 'Fluid Dynamics',
      };
      const { hashtags } = generateCaption('specimen', meta);
      expect(hashtags).toContain('#fluiddynamics');
    });
  });

  describe('intro template', () => {
    it('generates intro caption', () => {
      const meta: IntroMetadata = {
        slideCount: 5,
      };
      const { caption } = generateCaption('intro', meta);
      expect(caption).toContain('el jardin cibernetico');
      expect(caption).toContain('swipe for a tour');
      expect(caption).toContain('link in bio');
    });

    it('includes intro hashtags', () => {
      const meta: IntroMetadata = {
        slideCount: 5,
      };
      const { hashtags } = generateCaption('intro', meta);
      expect(hashtags).toContain('#jardincibernetico');
      expect(hashtags).toContain('#cyberneticgarden');
      expect(hashtags).toContain('#personalsite');
    });
  });

  describe('metalogue template', () => {
    it('generates metalogue caption', () => {
      const meta: MetalogueMetadata = {
        fragments: [
          { speaker: 'FIGURE', line: 'Why do we talk?' },
          { speaker: 'GROUND', line: 'To find out what we think.' },
        ],
        sourceTitle: 'Source Article',
        date: new Date(2026, 4, 7),
        slug: 'test-article',
      };
      const { caption } = generateCaption('metalogue', meta);
      expect(caption).toContain('metálogo de "Source Article"');
      expect(caption).toContain('FIGURE: Why do we talk?');
      expect(caption).toContain('GROUND: To find out what we think.');
      expect(caption).toContain('after Bateson');
    });

    it('uses metalogueTitle when provided', () => {
      const meta: MetalogueMetadata = {
        fragments: [{ speaker: 'A', line: 'Line' }],
        sourceTitle: 'Source',
        metalogueTitle: 'Custom Metalogue Title',
        date: new Date(2026, 4, 7),
        slug: 'test',
      };
      const { caption } = generateCaption('metalogue', meta);
      expect(caption).toContain('metálogo de "Custom Metalogue Title"');
    });

    it('includes metalogue hashtags', () => {
      const meta: MetalogueMetadata = {
        fragments: [],
        sourceTitle: 'Test',
        date: new Date(2026, 4, 7),
        slug: 'test',
      };
      const { hashtags } = generateCaption('metalogue', meta);
      expect(hashtags).toContain('#metalogo');
      expect(hashtags).toContain('#dialogue');
      expect(hashtags).toContain('#batesonian');
    });
  });
});

describe('createPostMetadata', () => {
  it('creates metadata object with required fields', () => {
    const meta: QuoteMetadata = {
      quote: 'Test',
      sourceTitle: 'Source',
      date: new Date(2026, 4, 7),
    };
    const postMeta = createPostMetadata('quote', meta);

    expect(postMeta.templateType).toBe('quote');
    expect(postMeta.metadata).toBe(meta);
    expect(postMeta.generatedAt).toBeDefined();
    expect(new Date(postMeta.generatedAt).getTime()).not.toBeNaN();
  });

  it('includes optional caption and hashtags when provided', () => {
    const meta: TitleMetadata = {
      title: 'Test',
      date: new Date(2026, 4, 7),
    };
    const postMeta = createPostMetadata('title', meta, 'Custom caption', '#custom');

    expect(postMeta.caption).toBe('Custom caption');
    expect(postMeta.hashtags).toBe('#custom');
  });
});
