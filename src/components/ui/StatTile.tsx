import React from 'react';
import { cn } from './cn';
import { Tone, toneText } from './tones';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** Short qualifier under the value — a unit, a trend, a source. */
  hint?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * A single number with its label. Values are tabular so a row of tiles lines
 * up on the decimal, and the label sits above the value to keep the number
 * itself the largest thing in the tile.
 */
export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
  className,
}) => (
  <div className={cn('rounded-card border border-line bg-surface px-3.5 py-3', className)}>
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon && <span className={cn('shrink-0', toneText[tone])}>{icon}</span>}
      <span className="eyebrow truncate">{label}</span>
    </div>
    <div className={cn('text-2xl font-bold tabular leading-none', toneText[tone], tone === 'neutral' && 'text-ink')}>
      {value}
    </div>
    {hint && <div className="mt-1.5 text-xs leading-4 text-ink-faint truncate">{hint}</div>}
  </div>
);
