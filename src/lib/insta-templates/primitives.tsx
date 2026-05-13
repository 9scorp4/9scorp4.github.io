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
 */
export function SunAccent({ size = 64 }: { size?: number }) {
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
export function SunMandala({ size = 200 }: { size?: number }) {
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
