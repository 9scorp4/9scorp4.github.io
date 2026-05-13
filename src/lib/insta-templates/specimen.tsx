/**
 * Specimen card template for Instagram (conservatory sketches).
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, SunAccent } from './primitives.tsx';

/**
 * SVG status icons for specimens.
 * Unicode symbols don't render in IM Fell DW Pica, so we use inline SVGs.
 */
export function StatusIcon({ status, size = 72 }: { status: string; size?: number }) {
  const iconColors: Record<string, string> = {
    growing: colors.fern,
    dormant: colors.ochre,
    wild: colors.inkSoft,
    composted: colors.inkFaint,
  };
  const color = iconColors[status] || colors.inkSoft;
  const stroke = 4;

  switch (status) {
    case 'growing':
      // Up-pointing triangle
      return (
        <svg width={size} height={size} viewBox="0 0 72 72">
          <polygon
            points="36,8 64,60 8,60"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'dormant':
      // Circle with left half filled
      return (
        <svg width={size} height={size} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth={stroke} />
          <path d="M36,8 A28,28 0 0,0 36,64 Z" fill={color} />
        </svg>
      );
    case 'wild':
      // Empty circle
      return (
        <svg width={size} height={size} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth={stroke} />
        </svg>
      );
    case 'composted':
      // X mark
      return (
        <svg width={size} height={size} viewBox="0 0 72 72">
          <line x1="14" y1="14" x2="58" y2="58" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <line x1="58" y1="14" x2="14" y2="58" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export interface SpecimenTemplateProps {
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  description: string;
  series?: string;
  seriesIndex?: number;
  format: InstaFormat;
  /** QR code data URL (optional) */
  qrDataUrl?: string;
}

export function SpecimenTemplate({
  name,
  status,
  description,
  series,
  seriesIndex,
  format,
  qrDataUrl,
}: SpecimenTemplateProps) {

  return (
    <div style={containerStyle(format)}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
      }}>
        {/* Header: series indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkFaint,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            conservatory
          </div>
          {series && seriesIndex && (
            <div style={{
              display: 'flex',
              fontFamily: 'IM Fell DW Pica',
              fontSize: '18px',
              color: colors.terracotta,
              letterSpacing: '0.1em',
            }}>
              {series} #{seriesIndex}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '24px',
          textAlign: 'center',
        }}>
          {/* Status indicator */}
          <StatusIcon status={status} size={72} />

          {/* Name */}
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '52px',
            fontStyle: 'italic',
            color: colors.ink,
            lineHeight: 1.3,
          }}>
            {name}
          </div>

          {/* Description */}
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '28px',
            color: colors.inkSoft,
            lineHeight: 1.5,
            maxWidth: '800px',
          }}>
            {description}
          </div>

          {/* Prominent QR code - centered below description */}
          {qrDataUrl && (
            <div style={{
              display: 'flex',
              marginTop: '16px',
            }}>
              <img
                src={qrDataUrl}
                width={180}
                height={180}
                style={{ display: 'flex' }}
              />
            </div>
          )}
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
          <SunAccent size={56} />
        </div>
      </div>
    </div>
  );
}
