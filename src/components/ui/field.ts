/**
 * Shared form geometry. Inputs across the product are the same height and
 * carry the same focus treatment, so a form never looks assembled from parts.
 */
export const fieldClass =
  'w-full rounded-control border border-line bg-sunken px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-faint transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-accent-line focus:outline-none ' +
  'focus:ring-2 focus:ring-accent/25';

/** Label sitting directly above a field. */
export const labelClass = 'block text-xs font-semibold text-ink-muted mb-1.5';

/** Mono caps label that introduces a group of controls or a sub-section. */
export const sectionLabelClass =
  'font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint';
