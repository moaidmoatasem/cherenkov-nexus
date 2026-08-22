import React from 'react';
import { cn } from './cn';
import { IconTile } from './IconTile';
import type { Tone } from './tones';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  /** One or two sentences. Say what this surface is for, not that it is empty. */
  description: string;
  tone?: Tone;
  /** Primary route out of the empty state. */
  action?: React.ReactNode;
  /** The lower-commitment alternative, e.g. loading sample data. */
  secondaryAction?: React.ReactNode;
  footnote?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * The state a surface shows before it has anything to show. Used where a first
 * run would otherwise be a blank grid — which is what the product did before
 * this, except it filled the blank with somebody else's job applications.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  tone = 'accent',
  action,
  secondaryAction,
  footnote,
  className,
  'data-testid': testId,
}) => (
  <div
    data-testid={testId}
    className={cn(
      'flex flex-col items-center text-center gap-4 px-6 py-14',
      'rounded-panel border border-dashed border-line bg-surface',
      className
    )}
  >
    <IconTile tone={tone} size="lg" solid>
      {icon}
    </IconTile>

    <div className="space-y-1.5 max-w-md">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
    </div>

    {(action || secondaryAction) && (
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {action}
        {secondaryAction}
      </div>
    )}

    {footnote && <p className="text-2xs text-ink-faint max-w-sm leading-relaxed">{footnote}</p>}
  </div>
);
