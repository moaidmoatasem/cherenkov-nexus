import React from 'react';
import { cn } from './cn';
import { Tone, toneChip } from './tones';

export interface BadgeProps {
  tone?: Tone;
  /** `mono` for machine values (counts, versions, ids), `sans` for words. */
  font?: 'mono' | 'sans';
  /** Leading status dot, sized to the text. */
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  font = 'sans',
  dot,
  icon,
  className,
  title,
  children,
}) => (
  <span
    title={title}
    className={cn(
      'inline-flex items-center gap-1.5 shrink-0 rounded-chip border px-1.5 py-0.5',
      'text-[11px] leading-4 font-semibold whitespace-nowrap',
      font === 'mono' && 'font-mono tabular',
      toneChip[tone],
      className
    )}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
    {icon}
    {children}
  </span>
);
