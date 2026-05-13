/**
 * Metalogue card template for Instagram (Bateson-style dialogue).
 */

import React from 'react';
import { colors, type InstaFormat } from './colors.ts';
import { containerStyle, TrilingualFooter, QRCorner } from './primitives.tsx';

/**
 * A single exchange in a metalogue dialogue.
 */
export interface MetalogueFragment {
  speaker: string;
  line: string;
}

/**
 * Dialogue glyph: two overlapping circles representing conversation.
 */
export function DialogueGlyph({ size = 64 }: { size?: number }) {
  const cx1 = size * 0.35;
  const cx2 = size * 0.65;
  const cy = size / 2;
  const radius = size * 0.3;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx1}
        cy={cy}
        r={radius}
        fill="none"
        stroke={colors.fern}
        strokeWidth="2.5"
      />
      <circle
        cx={cx2}
        cy={cy}
        r={radius}
        fill="none"
        stroke={colors.fern}
        strokeWidth="2.5"
      />
    </svg>
  );
}

/**
 * Determine if a speaker is the narrator (YO/I).
 */
export function isNarratorSpeaker(speaker: string): boolean {
  const normalized = speaker.toUpperCase().trim();
  return normalized === 'YO' || normalized === 'I';
}

export interface MetalogueTemplateProps {
  fragments: MetalogueFragment[];
  sourceTitle: string;
  metalogueTitle?: string;
  date: Date;
  format: InstaFormat;
  /** QR code data URL (optional) */
  qrDataUrl?: string;
}

export function MetalogueTemplate({
  fragments,
  sourceTitle,
  metalogueTitle,
  date,
  format,
  qrDataUrl,
}: MetalogueTemplateProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate font size based on total content length
  const totalLength = fragments.reduce((sum, f) => sum + f.line.length, 0);
  const baseFontSize = totalLength > 400 ? 28 : totalLength > 250 ? 32 : 36;

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
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkFaint,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            metálogo
          </div>
          <DialogueGlyph size={56} />
        </div>

        {/* Dialogue exchanges */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          flex: 1,
          justifyContent: 'center',
          paddingTop: '32px',
          paddingBottom: '32px',
        }}>
          {fragments.map((fragment, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {/* Speaker label */}
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: '16px',
                color: isNarratorSpeaker(fragment.speaker) ? colors.inkSoft : colors.terracotta,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {fragment.speaker}:
              </div>
              {/* Line */}
              <div style={{
                display: 'flex',
                fontFamily: 'IM Fell DW Pica',
                fontSize: `${baseFontSize}px`,
                fontStyle: 'italic',
                color: colors.ink,
                lineHeight: 1.5,
              }}>
                {fragment.line}
              </div>
            </div>
          ))}
        </div>

        {/* Attribution */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '24px',
            fontStyle: 'italic',
            color: colors.inkSoft,
          }}>
            {metalogueTitle || sourceTitle}
          </div>
          <div style={{
            display: 'flex',
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkFaint,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {formattedDate}
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
