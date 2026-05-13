/**
 * Visual components and slide configurations for the intro carousel.
 */

import React from 'react';
import { colors } from '../../src/lib/insta-templates.tsx';

export interface IntroSlideConfig {
  headline: string;
  subtext?: string;
  showMandala?: boolean;
  showSunAccent?: boolean;
  monospace?: boolean;
  customVisual?: React.ReactNode;
  showSiteFooter?: boolean;
  siteUrl?: string;
}

export function StatusSvg({ status, color, size = 48 }: { status: string; color: string; size?: number }) {
  const stroke = 3;

  switch (status) {
    case 'growing':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('polygon', {
          points: '24,6 44,40 4,40',
          fill: 'none',
          stroke: color,
          strokeWidth: stroke,
          strokeLinejoin: 'round',
        })
      );
    case 'dormant':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('circle', { cx: 24, cy: 24, r: 18, fill: 'none', stroke: color, strokeWidth: stroke }),
        React.createElement('path', { d: 'M24,6 A18,18 0 0,0 24,42 Z', fill: color })
      );
    case 'wild':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('circle', { cx: 24, cy: 24, r: 18, fill: 'none', stroke: color, strokeWidth: stroke })
      );
    case 'composted':
      return React.createElement('svg', { width: size, height: size, viewBox: '0 0 48 48' },
        React.createElement('line', { x1: 10, y1: 10, x2: 38, y2: 38, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' }),
        React.createElement('line', { x1: 38, y1: 10, x2: 10, y2: 38, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' })
      );
    default:
      return null;
  }
}

export function StatusSymbols() {
  const statuses = [
    { status: 'growing', label: 'growing', color: colors.fern },
    { status: 'dormant', label: 'dormant', color: colors.ochre },
    { status: 'wild', label: 'wild', color: colors.inkSoft },
    { status: 'composted', label: 'composted', color: colors.inkFaint },
  ];

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'row', gap: '48px', flexWrap: 'wrap', justifyContent: 'center' },
  }, statuses.map(({ status, label, color }) =>
    React.createElement('div', {
      key: label,
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    },
      React.createElement(StatusSvg, { status, color, size: 48 }),
      React.createElement('div', {
        style: { display: 'flex', fontFamily: 'IM Fell DW Pica', fontSize: '18px', color: colors.inkFaint, letterSpacing: '0.1em' },
      }, label)
    )
  ));
}

export function PromptGlyph() {
  return React.createElement('div', {
    style: { display: 'flex', fontFamily: 'monospace', fontSize: '72px', color: colors.sun },
  }, '>');
}

export function LibraryNames() {
  const names = ['bateson', 'beer', 'maturana', 'pask', 'wiener', 'von foerster'];
  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  },
    React.createElement('div', {
      style: { display: 'flex', fontFamily: 'IM Fell DW Pica', fontSize: '22px', color: colors.inkSoft, fontStyle: 'italic', letterSpacing: '0.05em' },
    }, names.join(' / '))
  );
}

export function getIntroSlides(): IntroSlideConfig[] {
  return [
    { headline: 'el jardin cibernetico', subtext: 'a garden that documents itself', showMandala: true },
    { headline: 'el ahora', subtext: "what's happening now, updated whenever", showSunAccent: true },
    { headline: 'el invernadero', subtext: 'generative sketches, numbered like specimens', showSunAccent: true },
    { headline: 'cuaderno de campo', subtext: 'long-form notes, some answer themselves back', showSunAccent: true },
    { headline: 'los cultivos', subtext: 'projects in various states', customVisual: React.createElement(StatusSymbols) },
    { headline: 'la biblioteca', customVisual: React.createElement(LibraryNames), showSunAccent: true },
    { headline: 'libro de visitas', subtext: 'leave a note, or type something unexpected', customVisual: React.createElement(PromptGlyph) },
    { headline: 'there are secrets in the root system', subtext: '8 hidden. more to come.', showSunAccent: true },
    { headline: 'open devtools sometime', subtext: 'try window.garden', monospace: true, showSunAccent: true },
    { headline: 'like a garden, it grows', showMandala: true, siteUrl: '9scorp4.github.io', showSiteFooter: true },
  ];
}
