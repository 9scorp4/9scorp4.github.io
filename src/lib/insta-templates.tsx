/**
 * JSX templates for Instagram image generation with Satori.
 * Square (1080×1080) and Portrait (1080×1350) formats.
 */

import React, { type ReactNode } from 'react';

// Extended palette for Instagram (matches src/styles/tokens.css)
export const colors = {
  paper: '#efe2c2',
  paperDeep: '#e8d9af',
  ink: '#3d2f1a',
  inkSoft: '#6b5435',
  inkFaint: '#8a7a5f',
  sun: '#c93f7a',
  fern: '#2d5a3d',
  ochre: '#c08820',
  terracotta: '#a8472a',
  paperLine: '#c9b886',
};

export type InstaFormat = 'square' | 'portrait';

export const INSTA_DIMENSIONS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

// Shared container styles
const containerStyle = (format: InstaFormat) => ({
  display: 'flex' as const,
  flexDirection: 'column' as const,
  width: '100%',
  height: '100%',
  backgroundColor: colors.paper,
  padding: format === 'square' ? '80px' : '100px 80px',
});

/**
 * Trilingual footer used across templates.
 */
function TrilingualFooter() {
  return (
    <div style={{
      display: 'flex',
      fontFamily: 'IM Fell DW Pica',
      fontSize: '24px',
      color: colors.inkFaint,
      fontStyle: 'italic',
    }}>
      cuaderno de campo · carnet de terrain · field journal
    </div>
  );
}

/**
 * QR code corner component.
 * Renders a QR code in the bottom-right of the footer area.
 * Styled to match the parchment aesthetic.
 */
function QRCorner({ dataUrl, size = 140 }: { dataUrl: string; size?: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <img
        src={dataUrl}
        width={size}
        height={size}
        style={{
          display: 'flex',
        }}
      />
    </div>
  );
}

/**
 * Mini sun accent SVG.
 */
function SunAccent({ size = 64 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.35;
  const seedRadius = size * 0.12;
  const rayLength = size * 0.15;

  const rays: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * (outerRadius + 2);
    const y1 = cy + Math.sin(angle) * (outerRadius + 2);
    const x2 = cx + Math.cos(angle) * (outerRadius + rayLength);
    const y2 = cy + Math.sin(angle) * (outerRadius + rayLength);
    rays.push(
      <line
        key={`ray-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colors.sun}
        strokeWidth="2.5"
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill="none"
        stroke={colors.sun}
        strokeWidth="2"
      />
      {rays}
      <circle
        cx={cx}
        cy={cy}
        r={seedRadius}
        fill={colors.sun}
      />
    </svg>
  );
}

/**
 * Sun mandala for larger displays.
 */
function SunMandala({ size = 200 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const seedRadius = size * 0.08;
  const rayLength = size * 0.12;
  const dotRadius = size * 0.025;

  const rays: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = cx + Math.cos(angle) * (outerRadius + 4);
    const y1 = cy + Math.sin(angle) * (outerRadius + 4);
    const x2 = cx + Math.cos(angle) * (outerRadius + rayLength);
    const y2 = cy + Math.sin(angle) * (outerRadius + rayLength);
    rays.push(
      <line
        key={`ray-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colors.sun}
        strokeWidth="2.5"
      />
    );
  }

  const dots: ReactNode[] = [];
  const cardinalAngles = [0, 90, 180, 270];
  for (const deg of cardinalAngles) {
    const angle = (deg * Math.PI) / 180;
    const x = cx + Math.cos(angle) * (outerRadius + rayLength + 8);
    const y = cy + Math.sin(angle) * (outerRadius + rayLength + 8);
    dots.push(
      <circle
        key={`dot-${deg}`}
        cx={x}
        cy={y}
        r={dotRadius}
        fill={colors.sun}
      />
    );
  }

  const starPoints1 = [0, 120, 240].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * innerRadius},${cy + Math.sin(angle) * innerRadius}`;
  }).join(' ');

  const starPoints2 = [60, 180, 300].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * innerRadius},${cy + Math.sin(angle) * innerRadius}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill="none"
        stroke={colors.sun}
        strokeWidth="2.5"
      />
      {rays}
      {dots}
      <polygon
        points={starPoints1}
        fill="none"
        stroke={colors.sun}
        strokeWidth="2"
      />
      <polygon
        points={starPoints2}
        fill="none"
        stroke={colors.sun}
        strokeWidth="2"
      />
      <circle
        cx={cx}
        cy={cy}
        r={seedRadius}
        fill={colors.sun}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Template: Intro Slide (for carousels)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Template: Quote Card
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Template: Title Card
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Template: Status Update (ahora)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Template: Specimen Card
// ─────────────────────────────────────────────────────────────

/**
 * SVG status icons for specimens.
 * Unicode symbols don't render in IM Fell DW Pica, so we use inline SVGs.
 */
function StatusIcon({ status, size = 72 }: { status: string; size?: number }) {
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

// ─────────────────────────────────────────────────────────────
// Template: Metalogue Card (Bateson-style dialogue)
// ─────────────────────────────────────────────────────────────

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
function DialogueGlyph({ size = 64 }: { size?: number }) {
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
function isNarratorSpeaker(speaker: string): boolean {
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
