import React from 'react';

// Lucide, outline only, 1.5 px stroke, never filled (design/DESIGN.md §4).
type Props = {size?: number; className?: string};

function Icon({size = 16, className, children}: Props & {children: React.ReactNode}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}>
      {children}
    </svg>
  );
}

export const Check = (p: Props) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const Minus = (p: Props) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const Copy = (p: Props) => (
  <Icon {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);
