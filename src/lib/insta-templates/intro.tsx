/**
 * Intro slide template for Instagram carousels.
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, SunMandala, SunAccent } from './primitives.tsx';

export interface IntroSlideTemplateProps {
  headline: string;
  subtext?: string;
  /** Large centered mandala (title/closing slides) */
  showMandala?: boolean;
  /** Small sun accent (section slides) */
  showSunAccent?: boolean;
  /** Monospace styling for subtext (devtools hint) */
  monospace?: boolean;
  /** Custom visual element (replaces mandala/sun) */
  customVisual?: React.ReactNode;
  /** Show trilingual site footer */
  showSiteFooter?: boolean;
  /** Show site URL in footer area */
  siteUrl?: string;
  format: InstaFormat;
}

export function IntroSlideTemplate({
  headline,
  subtext,
  showMandala,
  showSunAccent,
  monospace,
  customVisual,
  showSiteFooter,
  siteUrl,
  format,
}: IntroSlideTemplateProps) {
  // Headline size adapts to length
  const headlineFontSize = headline.length > 30 ? 48 : headline.length > 20 ? 56 : 64;

  return (
    <div style={containerStyle(format)}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '32px',
      }}>
        {/* Visual element */}
        {customVisual ? (
          <div style={{ display: 'flex' }}>{customVisual}</div>
        ) : showMandala ? (
          <SunMandala size={format === 'square' ? 240 : 280} />
        ) : showSunAccent ? (
          <SunAccent size={80} />
        ) : null}

        {/* Headline */}
        <div style={{
          display: 'flex',
          fontFamily: 'IM Fell DW Pica',
          fontSize: `${headlineFontSize}px`,
          fontStyle: 'italic',
          color: colors.ink,
          lineHeight: 1.3,
          maxWidth: '900px',
        }}>
          {headline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div style={{
            display: 'flex',
            fontFamily: monospace ? 'monospace' : 'IM Fell DW Pica',
            fontSize: monospace ? '24px' : '32px',
            fontStyle: monospace ? 'normal' : 'italic',
            color: colors.inkSoft,
            lineHeight: 1.5,
            maxWidth: '800px',
            letterSpacing: monospace ? '0.02em' : 'normal',
          }}>
            {subtext}
          </div>
        )}

        {/* Site URL (closing slide) */}
        {siteUrl && (
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '28px',
            color: colors.sun,
            marginTop: '16px',
          }}>
            {siteUrl}
          </div>
        )}
      </div>

      {/* Footer */}
      {showSiteFooter && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: `1px solid ${colors.paperLine}`,
          paddingTop: '32px',
          marginTop: '32px',
        }}>
          <TrilingualFooter />
        </div>
      )}
    </div>
  );
}
