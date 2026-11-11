'use client';

import { useId } from 'react';

const NAVY  = '#24356f';
const DEEP  = '#1b2858';
const CREAM = '#efe6d2';

// Ornate card back: cream margin, stippled navy field, a border band of
// rosettes with larger corner rosettes, and a centre panel with a
// symmetric leaf-and-vine motif. Drawn on a 100×150 canvas.
export function CardBack() {
  const uid  = useId().replace(/:/g, '');
  const dots = `dots-${uid}`;
  const ros  = `ros-${uid}`;
  const leaf = `leaf-${uid}`;
  const half = `half-${uid}`;

  // Evenly spaced between the corner rosettes so nothing overlaps
  const side = [31, 45.7, 60.3, 75, 89.7, 104.3, 119];
  const top  = [32, 44, 56, 68];
  const corners: [number, number][] = [[16, 18], [84, 18], [16, 132], [84, 132]];

  return (
    <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <pattern id={dots} width="2.6" height="2.6" patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.38" fill={CREAM} opacity="0.4" />
        </pattern>

        {/* Rosette, radius 10 */}
        <symbol id={ros} viewBox="-10 -10 20 20" overflow="visible">
          <circle r="9.2" fill={NAVY} stroke={CREAM} strokeWidth="1" />
          <circle r="7.4" fill="none" stroke={CREAM} strokeWidth="0.4" />
          {Array.from({ length: 8 }).map((_, k) => (
            <ellipse key={k} cx="0" cy="-4.4" rx="1.7" ry="3.2" fill={CREAM} transform={`rotate(${k * 45})`} />
          ))}
          <circle r="1.7" fill={NAVY} stroke={CREAM} strokeWidth="0.6" />
        </symbol>

        {/* Leaf pointing right, length 14 */}
        <symbol id={leaf} viewBox="0 -5 14 10" overflow="visible">
          <path d="M0 0 C 3 -4.5, 9 -4.8, 14 0 C 9 4.8, 3 4.5, 0 0 Z" fill={CREAM} />
          <path d="M1 0 L 12.5 0" stroke={DEEP} strokeWidth="0.6" />
          <path d="M4 0 L 6 -2 M7 0 L 9 -2 M4 0 L 6 2 M7 0 L 9 2" stroke={DEEP} strokeWidth="0.4" />
        </symbol>

        {/* One quarter of the centre motif (upper-right); mirrored into four */}
        <g id={half}>
          {/* Main stem */}
          <path d="M50 75 C 50 66, 53 60, 50 52 C 47 45, 50 38, 50 32" fill="none" stroke={CREAM} strokeWidth="1.2" />
          {/* Scrolling vines reaching into the panel corners */}
          <path d="M51 66 C 60 66, 70 62, 70 54 C 70 49, 65 48, 64 51 C 63 53, 66 54, 66 52" fill="none" stroke={CREAM} strokeWidth="0.7" />
          <path d="M51 50 C 58 46, 68 42, 70 35 C 71 31, 67 30, 66 33" fill="none" stroke={CREAM} strokeWidth="0.7" />
          <path d="M51 70 C 58 72, 66 74, 71 71" fill="none" stroke={CREAM} strokeWidth="0.5" />
          {/* Leaves — large near the centre, smaller toward the top */}
          <use href={`#${leaf}`} x="0" y="-5" width="14" height="10" transform="translate(51 63) rotate(-22) scale(1.35)" />
          <use href={`#${leaf}`} x="0" y="-5" width="14" height="10" transform="translate(51 50) rotate(-48) scale(1.05)" />
          <use href={`#${leaf}`} x="0" y="-5" width="14" height="10" transform="translate(50.5 39) rotate(-70) scale(0.7)" />
          <use href={`#${leaf}`} x="0" y="-5" width="14" height="10" transform="translate(66 41) rotate(-110) scale(0.55)" />
          {/* Buds */}
          <circle cx="66" cy="52" r="1.3" fill={CREAM} />
          <circle cx="66" cy="33" r="1.3" fill={CREAM} />
          <circle cx="71" cy="71" r="1.1" fill={CREAM} />
          <circle cx="52.6" cy="31.5" r="1.6" fill={CREAM} />
        </g>
      </defs>

      {/* Cream margin + navy field */}
      <rect width="100" height="150" fill={CREAM} />
      <rect x="5" y="5" width="90" height="140" rx="3" fill={NAVY} />
      <rect x="5" y="5" width="90" height="140" rx="3" fill={`url(#${dots})`} />
      <rect x="7.5" y="7.5" width="85" height="135" rx="2.2" fill="none" stroke={CREAM} strokeWidth="0.8" />

      {/* Border rosettes */}
      {side.map((y) => (
        <g key={`s${y}`}>
          <use href={`#${ros}`} x={16 - 5} y={y - 5} width="10" height="10" />
          <use href={`#${ros}`} x={84 - 5} y={y - 5} width="10" height="10" />
        </g>
      ))}
      {top.map((x) => (
        <g key={`t${x}`}>
          <use href={`#${ros}`} x={x - 5} y={17 - 5} width="10" height="10" />
          <use href={`#${ros}`} x={x - 5} y={133 - 5} width="10" height="10" />
        </g>
      ))}
      {corners.map(([x, y]) => (
        <use key={`c${x}${y}`} href={`#${ros}`} x={x - 7.5} y={y - 7.5} width="15" height="15" />
      ))}

      {/* Centre panel */}
      <rect x="24" y="26" width="52" height="98" rx="2" fill={DEEP} stroke={CREAM} strokeWidth="1" />
      <rect x="26.2" y="28.2" width="47.6" height="93.6" rx="1.4" fill="none" stroke={CREAM} strokeWidth="0.4" />

      {/* Leaf-and-vine motif, mirrored left/right and top/bottom */}
      <use href={`#${half}`} />
      <use href={`#${half}`} transform="translate(100 0) scale(-1 1)" />
      <use href={`#${half}`} transform="rotate(180 50 75)" />
      <use href={`#${half}`} transform="rotate(180 50 75) translate(100 0) scale(-1 1)" />

      {/* Centre medallion */}
      <use href={`#${ros}`} x={44} y={69} width="12" height="12" />
    </svg>
  );
}
