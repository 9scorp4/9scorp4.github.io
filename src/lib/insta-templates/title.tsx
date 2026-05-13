/**
 * Title card template for Instagram.
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, QRCorner, SunMandala } from './primitives.tsx';

export interface TitleTemplateProps {
  title: string;
  titleSecondary?: string;
  date: Date;
  isDiptych?: boolean;
  format: InstaFormat;
  /** QR code data URL (optional) */
  qrDataUrl?: string;
}

export function TitleTemplate({ title, titleSecondary, date, isDiptych, format, qrDataUrl }: TitleTemplateProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={containerStyle(format)}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Top spacer */}
        <div style={{ display: 'flex' }} />

        {/* Center content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
        }}>
          <SunMandala size={format === 'square' ? 180 : 220} />

          {/* Title */}
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '56px',
            fontStyle: 'italic',
            color: colors.ink,
            lineHeight: 1.3,
            maxWidth: '900px',
          }}>
            {title}
          </div>

          {/* Secondary title */}
          {titleSecondary && (
            <div style={{
              display: 'flex',
              fontFamily: 'IM Fell DW Pica',
              fontSize: '36px',
              fontStyle: 'italic',
              color: colors.inkSoft,
              lineHeight: 1.3,
            }}>
              {titleSecondary}
            </div>
          )}

          {/* Date + diptych marker */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              display: 'flex',
              fontFamily: 'IM Fell DW Pica',
              fontSize: '22px',
              color: colors.inkFaint,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {formattedDate}
            </div>
            {isDiptych && (
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '22px',
                color: colors.sun,
                letterSpacing: '0.2em',
              }}>
                * * *
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${colors.paperLine}`,
          paddingTop: '32px',
          width: '100%',
        }}>
          <TrilingualFooter />
          {qrDataUrl && <QRCorner dataUrl={qrDataUrl} />}
        </div>
      </div>
    </div>
  );
}
