import React from 'react';
import { cn } from './cn';
import { IconTile } from './IconTile';
import { Tone } from './tones';

export interface PanelHeaderProps {
  icon?: React.ReactNode;
  tone?: Tone;
  /** Small mono label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Chips rendered inline after the title. */
  meta?: React.ReactNode;
  /** Buttons rendered on the trailing edge; they wrap below on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The masthead every workspace opens with. It owns the one h1-scale type ramp
 * in the product, so titles stay comparable module to module.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  icon,
  tone = 'accent',
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}) => (
  <div
    className={cn(
      'flex flex-wrap items-start justify-between gap-x-6 gap-y-4',
      className
    )}
  >
    <div className="flex items-start gap-3.5 min-w-0 flex-1">
      {icon && (
        <IconTile tone={tone} size="lg" solid className="mt-0.5">
          {icon}
        </IconTile>
      )}

      <div className="min-w-0 space-y-1.5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            {title}
          </h2>
          {meta}
        </div>

        {description && (
          <p className="text-sm leading-relaxed text-ink-muted max-w-2xl">
            {description}
          </p>
        )}
      </div>
    </div>

    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
