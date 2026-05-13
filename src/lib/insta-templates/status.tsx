/**
 * Status update template for Instagram (ahora dispatches).
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, QRCorner, SunAccent } from './primitives.tsx';

export interface StatusTemplateProps {
  date: Date;
  temperatura?: string;
  escuchando?: string;
  cultivando?: string;
  format: InstaFormat;
  /** QR code data URL (optional) */
  qrDataUrl?: string;
}

export function StatusTemplate({ date, temperatura, escuchando, cultivando, format, qrDataUrl }: StatusTemplateProps) {
  const formattedDate = date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fields = [
    { label: 'temperatura', value: temperatura },
    { label: 'escuchando', value: escuchando },
    { label: 'cultivando', value: cultivando },
  ].filter(f => f.value);

  return (
    <div style={containerStyle(format)}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkFaint,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            el ahora
          </div>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '32px',
            fontStyle: 'italic',
            color: colors.ink,
          }}>
            {formattedDate}
          </div>
        </div>

        {/* Status fields */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          flex: 1,
          justifyContent: 'center',
          paddingTop: '40px',
          paddingBottom: '40px',
        }}>
          {fields.map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '18px',
                color: colors.sun,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {label}
              </div>
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '32px',
                fontStyle: 'italic',
                color: colors.ink,
                lineHeight: 1.4,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with sun and QR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${colors.paperLine}`,
          paddingTop: '32px',
        }}>
          <TrilingualFooter />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {qrDataUrl && <QRCorner dataUrl={qrDataUrl} />}
            <SunAccent size={56} />
          </div>
        </div>
      </div>
    </div>
  );
}
