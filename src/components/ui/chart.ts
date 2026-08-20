/**
 * Chart colours resolve through the same tokens as the rest of the product,
 * so a chart is correct in all eight themes and in light mode for free.
 * Recharts passes these straight into SVG `fill`/`stroke`, which accept
 * `var()` just like CSS does.
 *
 * `chartSeries` is the categorical ramp: accent first, then the status hues,
 * then neutral. Reach for `chartStatus` instead whenever a series actually
 * means pass / fail — colour should carry meaning before it carries identity.
 */
export const chartSeries = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const;

export const chartStatus = {
  positive: 'var(--color-positive)',
  caution: 'var(--color-caution)',
  critical: 'var(--color-critical)',
  info: 'var(--color-info)',
  accent: 'var(--color-accent)',
  neutral: 'var(--color-chart-5)',
} as const;

/** Axes, gridlines and tooltip chrome. */
export const chartAxis = {
  tick: 'var(--color-ink-faint)',
  grid: 'var(--color-line)',
  tooltipBg: 'var(--color-elevated)',
  tooltipBorder: 'var(--color-line-strong)',
  tooltipInk: 'var(--color-ink)',
} as const;

/** The five pipeline stages, in board order. */
export const stageColor = {
  'Saved': chartStatus.neutral,
  'Upskilling': chartStatus.caution,
  'Ready to Apply': chartStatus.accent,
  'Applied': chartStatus.info,
  'Interviewing': chartStatus.positive,
} as const;
