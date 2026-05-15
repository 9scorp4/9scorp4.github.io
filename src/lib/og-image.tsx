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
 * Golden ratio proportions matching the p5 animated version.
 */
function SunMandala({ size = 160 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;

  // Golden ratio proportions (scaled from 80px base)
  const scale = size / 80;
  const outerRadius = 37 * scale;
  const diamondRadius = 35 * scale;
  const rayInner = 23 * scale;
  const rayOuter = 29 * scale;
  const petalInner = 12 * scale;
  const petalOuter = 18 * scale;
  const starRadius = 14 * scale;
  const seedRadius = 2.25 * scale;
  const diamondSize = 2 * scale;

  // Generate 12 tapered rays (inside outer circle)
  const rays: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const innerWidth = 0.8 * scale;
    const outerWidth = 0.3 * scale;

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const innerX = cx + Math.cos(angle) * rayInner;
    const innerY = cy + Math.sin(angle) * rayInner;
    const outerX = cx + Math.cos(angle) * rayOuter;
    const outerY = cy + Math.sin(angle) * rayOuter;

    const points = [
      `${innerX + perpX * innerWidth},${innerY + perpY * innerWidth}`,
      `${outerX + perpX * outerWidth},${outerY + perpY * outerWidth}`,
      `${outerX - perpX * outerWidth},${outerY - perpY * outerWidth}`,
      `${innerX - perpX * innerWidth},${innerY - perpY * innerWidth}`,
    ].join(' ');

    rays.push(
      <polygon
        key={`ray-${i}`}
        points={points}
        fill={colors.sun}
      />
    );
  }

  // 4 cardinal diamonds
  const diamonds: ReactNode[] = [];
  const cardinalAngles = [-90, 0, 90, 180]; // N, E, S, W
  for (const deg of cardinalAngles) {
    const angle = (deg * Math.PI) / 180;
    const x = cx + Math.cos(angle) * diamondRadius;
    const y = cy + Math.sin(angle) * diamondRadius;
    const points = [
      `${x},${y - diamondSize}`,
      `${x + diamondSize},${y}`,
      `${x},${y + diamondSize}`,
      `${x - diamondSize},${y}`,
    ].join(' ');
    diamonds.push(
      <polygon
        key={`diamond-${deg}`}
        points={points}
        fill={colors.sun}
      />
    );
  }

  // 6 petal corona (bezier curves)
  const petals: ReactNode[] = [];
  const petalWidth = 3 * scale;
  const bulgePoint = 0.6;
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;

    const innerX = cx + Math.cos(angle) * petalInner;
    const innerY = cy + Math.sin(angle) * petalInner;
    const outerX = cx + Math.cos(angle) * petalOuter;
    const outerY = cy + Math.sin(angle) * petalOuter;

    const bulgeR = petalInner + (petalOuter - petalInner) * bulgePoint;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const bulgeLeftX = cx + Math.cos(angle) * bulgeR + perpX * petalWidth;
    const bulgeLeftY = cy + Math.sin(angle) * bulgeR + perpY * petalWidth;
    const bulgeRightX = cx + Math.cos(angle) * bulgeR - perpX * petalWidth;
    const bulgeRightY = cy + Math.sin(angle) * bulgeR - perpY * petalWidth;

    const ctrlOffset = 1.5 * scale;

    const d = [
      `M ${innerX} ${innerY}`,
      `C ${innerX + perpX * ctrlOffset} ${innerY + perpY * ctrlOffset}`,
      `${bulgeLeftX} ${bulgeLeftY}`,
      `${outerX} ${outerY}`,
      `C ${bulgeRightX} ${bulgeRightY}`,
      `${innerX - perpX * ctrlOffset} ${innerY - perpY * ctrlOffset}`,
      `${innerX} ${innerY}`,
    ].join(' ');

    petals.push(
      <path
        key={`petal-${i}`}
        d={d}
        fill="none"
        stroke={colors.sun}
        strokeWidth={0.8 * scale}
      />
    );
  }

  // 6-pointed star (two triangles)
  const starPoints1 = [0, 120, 240].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * starRadius},${cy + Math.sin(angle) * starRadius}`;
  }).join(' ');

  const starPoints2 = [60, 180, 300].map((deg) => {
    const angle = ((deg - 90) * Math.PI) / 180;
    return `${cx + Math.cos(angle) * starRadius},${cy + Math.sin(angle) * starRadius}`;
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
        strokeWidth={1.0 * scale}
      />
      {/* Cardinal diamonds */}
      {diamonds}
      {/* Tapered rays */}
      {rays}
      {/* Petal corona */}
      {petals}
      {/* 6-pointed star */}
      <polygon
        points={starPoints1}
        fill="none"
        stroke={colors.sun}
        strokeWidth={1.2 * scale}
      />
      <polygon
        points={starPoints2}
        fill="none"
        stroke={colors.sun}
        strokeWidth={1.2 * scale}
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
 * Simplified version with proportional scaling.
 */
function SunAccent({ size = 48 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 80;
  const outerRadius = 28 * scale;
  const rayInner = 18 * scale;
  const rayOuter = 24 * scale;
  const seedRadius = 2.25 * scale;

  // 8 tapered rays
  const rays: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 * Math.PI) / 180;
    const innerWidth = 0.6 * scale;
    const outerWidth = 0.2 * scale;

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const innerX = cx + Math.cos(angle) * rayInner;
    const innerY = cy + Math.sin(angle) * rayInner;
    const outerX = cx + Math.cos(angle) * rayOuter;
    const outerY = cy + Math.sin(angle) * rayOuter;

    const points = [
      `${innerX + perpX * innerWidth},${innerY + perpY * innerWidth}`,
      `${outerX + perpX * outerWidth},${outerY + perpY * outerWidth}`,
      `${outerX - perpX * outerWidth},${outerY - perpY * outerWidth}`,
      `${innerX - perpX * innerWidth},${innerY - perpY * innerWidth}`,
    ].join(' ');

    rays.push(
      <polygon
        key={`ray-${i}`}
        points={points}
        fill={colors.sun}
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
        strokeWidth={1.5 * scale}
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
