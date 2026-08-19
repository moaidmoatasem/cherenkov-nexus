import React from 'react';
import { cn } from './cn';
import { Tone, toneTile } from './tones';

const sizes = {
  sm: 'w-7 h-7 rounded-chip',
  md: 'w-9 h-9 rounded-control',
  lg: 'w-11 h-11 rounded-card',
} as const;

export interface IconTileProps {
  tone?: Tone;
  size?: keyof typeof sizes;
  /** Solid tone fill (selected/primary) versus a quiet neutral tile. */
  solid?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const IconTile: React.FC<IconTileProps> = ({
  tone = 'accent',
  size = 'md',
  solid,
  className,
  children,
}) => (
  <div
    className={cn(
      'inline-flex items-center justify-center shrink-0 transition-colors duration-150',
      sizes[size],
      solid ? toneTile[tone] : 'bg-fill text-ink-muted',
      className
    )}
  >
    {children}
  </div>
);
