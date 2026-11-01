import { useId } from 'react';

const CHIP_PINS =
  'M22 7V13M22 51V57M7 22H13M51 22H57M32 7V13M32 51V57M7 32H13M51 32H57M42 7V13M42 51V57M7 42H13M51 42H57';
const BRACES =
  'M26 21.5C23 21.5 23 23.5 23 26.5C23 29.5 22 31.2 20 32C22 32.8 23 34.5 23 37.5C23 40.5 23 42.5 26 42.5M38 21.5C41 21.5 41 23.5 41 26.5C41 29.5 42 31.2 44 32C42 32.8 41 34.5 41 37.5C41 40.5 41 42.5 38 42.5';
const SPARK =
  'M32 24.5C33.2 30.08 33.92 30.8 39.5 32C33.92 33.2 33.2 33.92 32 39.5C30.8 33.92 30.08 33.2 24.5 32C30.08 30.8 30.8 30.08 32 24.5Z';

function LogoMark() {
  const id = useId();
  const gradient = `${id}-degrade`;
  const glow = `${id}-halo`;
  return (
    <svg className="mark" viewBox="0 0 64 64" aria-hidden focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset=".55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <radialGradient id={glow} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#a855f7" stopOpacity=".55" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0b0a1a" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeOpacity=".35"
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="20" fill={`url(#${glow})`} />
      <rect
        x="13"
        y="13"
        width="38"
        height="38"
        rx="9"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="3.2"
      />
      <path d={CHIP_PINS} stroke={`url(#${gradient})`} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d={BRACES}
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={SPARK} fill={`url(#${gradient})`} />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="studia-logo">
      <LogoMark />
      <span>
        Stud<span className="neon-text">IA</span>
      </span>
    </div>
  );
}
