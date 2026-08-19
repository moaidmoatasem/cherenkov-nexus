import React from 'react';
import { cn } from './cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

/**
 * Two-to-four mutually exclusive views. The selected segment is filled rather
 * than outlined so the control reads at a glance in dense panels.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-control bg-sunken border border-line',
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-chip font-semibold whitespace-nowrap',
              'transition-colors duration-150 cursor-pointer',
              size === 'sm' ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-xs',
              selected
                ? 'bg-accent text-accent-contrast'
                : 'text-ink-muted hover:text-ink hover:bg-fill'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
