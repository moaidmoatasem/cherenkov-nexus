import React from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-contrast border-transparent hover:bg-accent-strong shadow-card',
  secondary:
    'bg-fill text-ink border-line hover:bg-fill-strong hover:border-line-strong',
  ghost:
    'bg-transparent text-ink-muted border-transparent hover:bg-fill hover:text-ink',
  outline:
    'bg-accent-soft text-accent-ink border-accent-line hover:bg-accent/20',
  danger:
    'bg-critical-soft text-critical-ink border-critical-line hover:bg-critical/20',
};

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-chip',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-control',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-control',
  lg: 'h-11 px-5 text-sm gap-2 rounded-card',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Leading glyph. Keep to 14–16px icons so the optical height stays even. */
  icon?: React.ReactNode;
  /** Trailing glyph, usually a chevron or keyboard hint. */
  trailing?: React.ReactNode;
  /** Stretch to the container width. */
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'sm',
  icon,
  trailing,
  block,
  className,
  children,
  ...rest
}) => (
  <button
    type="button"
    {...rest}
    className={cn(
      'inline-flex items-center justify-center border font-semibold whitespace-nowrap',
      'transition-colors duration-150 cursor-pointer',
      'disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-transparent',
      variants[variant],
      sizes[size],
      block && 'w-full',
      className
    )}
  >
    {/* Children are rendered as-is so a caller can hide the label with a
        responsive utility and collapse the button to its icon — a wrapper
        element would keep occupying a flex gap. */}
    {icon}
    {children}
    {trailing}
  </button>
);
