/**
 * Quote card template for Instagram.
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, QRCorner, SunAccent } from './primitives.tsx';

export interface QuoteTemplateProps {
  quote: string;
  sourceTitle: string;
  date: Date;
  format: InstaFormat;
  /** QR code data URL (optional) */
  qrDataUrl?: string;
}

export function QuoteTemplate({ quote, sourceTitle, date, format, qrDataUrl }: QuoteTemplateProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Adjust font size based on quote length
  const quoteFontSize = quote.length > 300 ? 36 : quote.length > 200 ? 42 : 48;

  return (
    <div style={containerStyle(format)}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
      }}>
        {/* Quote body */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          paddingBottom: '40px',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: `${quoteFontSize}px`,
            fontStyle: 'italic',
            color: colors.ink,
            lineHeight: 1.5,
          }}>
            "{quote}"
          </div>

          {/* Attribution */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '40px',
            gap: '16px',
          }}>
            <SunAccent size={48} />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '28px',
                fontStyle: 'italic',
                color: colors.inkSoft,
              }}>
                {sourceTitle}
              </div>
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '20px',
                color: colors.inkFaint,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {formattedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${colors.paperLine}`,
          paddingTop: '32px',
        }}>
          <TrilingualFooter />
          {qrDataUrl && <QRCorner dataUrl={qrDataUrl} />}
        </div>
      </div>
    </div>
  );
}
