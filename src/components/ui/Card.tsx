import React from 'react';
import { cn } from './cn';

type Elevation = 'flat' | 'raised' | 'sunken';

const elevations: Record<Elevation, string> = {
  /** Sits on the canvas. The default for content panels. */
  flat: 'bg-surface border-line',
  /** Floats above the canvas — popovers, dialogs, drag previews. */
  raised: 'bg-elevated border-line-strong shadow-pop',
  /** Recessed well — code output, empty drop zones, inline previews. */
  sunken: 'bg-sunken border-line',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 sm:p-6',
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  padding?: keyof typeof paddings;
  /** Draws the accent hairline + tint, for the currently selected card. */
  active?: boolean;
  /** Adds a hover affordance. Only for cards that are actually clickable. */
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'flat',
  padding = 'md',
  active,
  interactive,
  className,
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={cn(
      'rounded-card border',
      elevations[elevation],
      paddings[padding],
      interactive && 'transition-colors duration-150 hover:bg-surface-hover hover:border-line-strong',
      active && 'border-accent-line bg-accent-soft',
      className
    )}
  >
    {children}
  </div>
);
