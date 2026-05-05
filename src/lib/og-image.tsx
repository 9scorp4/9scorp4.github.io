/**
 * JSX templates for OG image generation with Satori.
 * Colors hardcoded since Satori doesn't support CSS variables.
 */

import React, { type ReactNode } from 'react';

// Palette (matches src/styles/tokens.css)
const colors = {
  paper: '#efe2c2',
  ink: '#3d2f1a',
  inkSoft: '#6b5435',
  inkFaint: '#8a7a5f',
  sun: '#c93f7a',
  paperLine: '#c9b886',
};

// Shared container styles
const containerStyle = {
  display: 'flex',
  width: '100%',
  height: '100%',
  backgroundColor: colors.paper,
  padding: '60px',
};

/**
 * Simplified sun mandala SVG for OG images.
 * Outer circle + rays + star + central seed.
 */
function SunMandala({ size = 160 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.25;
  const seedRadius = size * 0.08;
  const rayLength = size * 0.12;
  const dotRadius = size * 0.025;

  // Generate 12 rays
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
        strokeWidth="2"
      />
    );
  }

  // 4 cardinal dots
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

  // 6-pointed star (two triangles)
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
      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={outerRadius}
        fill="none"
        stroke={colors.sun}
        strokeWidth="2"
      />
      {/* Rays */}
      {rays}
      {/* Cardinal dots */}
      {dots}
      {/* 6-pointed star */}
      <polygon
        points={starPoints1}
        fill="none"
        stroke={colors.sun}
        strokeWidth="1.5"
      />
      <polygon
        points={starPoints2}
        fill="none"
        stroke={colors.sun}
        strokeWidth="1.5"
      />
      {/* Central seed */}
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
 * Mini sun accent for article OG images.
 */
function SunAccent({ size = 48 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.35;
  const seedRadius = size * 0.12;
  const rayLength = size * 0.15;

  // 8 rays
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
        strokeWidth="2"
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
        strokeWidth="1.5"
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
 * Default OG image for the homepage.
 */
export function DefaultOGImage() {
  return (
    <div style={containerStyle}>
      {/* Left: Sun mandala */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '60px',
      }}>
        <SunMandala size={200} />
      </div>

      {/* Right: Text content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
      }}>
        <div style={{
          fontFamily: 'IM Fell DW Pica',
          fontSize: '56px',
          fontStyle: 'italic',
          color: colors.ink,
          marginBottom: '20px',
          lineHeight: 1.2,
        }}>
          un jardín cibernético
        </div>
        <div style={{
          fontFamily: 'IM Fell DW Pica',
          fontSize: '28px',
          color: colors.inkSoft,
          lineHeight: 1.4,
        }}>
          sketches, field notes, and cultivations
        </div>
      </div>
    </div>
  );
}

interface ArticleOGImageProps {
  title: string;
  date: Date;
}

/**
 * OG image for journal/cuaderno entries.
 */
export function ArticleOGImage({ title, date }: ArticleOGImageProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
      }}>
        {/* Top: Title and date */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            fontFamily: 'IM Fell DW Pica',
            fontSize: '52px',
            fontStyle: 'italic',
            color: colors.ink,
            marginBottom: '24px',
            lineHeight: 1.25,
            maxWidth: '900px',
          }}>
            {title}
          </div>
          <div style={{
            fontFamily: 'IM Fell DW Pica',
            fontSize: '20px',
            color: colors.inkFaint,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {formattedDate}
          </div>
        </div>

        {/* Bottom: Footer with trilingual label and sun accent */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${colors.paperLine}`,
          paddingTop: '24px',
        }}>
          <div style={{
            fontFamily: 'IM Fell DW Pica',
            fontSize: '18px',
            color: colors.inkSoft,
            fontStyle: 'italic',
          }}>
            cuaderno de campo · carnet de terrain · field journal
          </div>
          <SunAccent size={56} />
        </div>
      </div>
    </div>
  );
}
