/**
 * Shared primitive components for Instagram templates.
 */

import React, { type ReactNode } from 'react';
import { colors, type InstaFormat } from './colors.ts';

/**
 * Shared container styles for all templates.
 */
export const containerStyle = (format: InstaFormat) => ({
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
export function TrilingualFooter() {
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
export function QRCorner({ dataUrl, size = 140 }: { dataUrl: string; size?: number }) {
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
 * Simplified version with proportional scaling.
 */
export function SunAccent({ size = 64 }: { size?: number }) {
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
 * Sun mandala for larger displays.
 * Golden ratio proportions matching the p5 animated version.
 */
export function SunMandala({ size = 200 }: { size?: number }) {
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
