/**
 * Tones are the only sanctioned way to colour a chip, an icon tile or a rail.
 * `accent` carries interaction; the four status tones carry meaning and are
 * never used for decoration. Every value resolves through theme tokens, so a
 * component styled with a tone is correct in all eight themes for free.
 */
export type Tone = 'neutral' | 'accent' | 'accent2' | 'positive' | 'caution' | 'critical' | 'info';

/** Tinted pill: soft fill, hairline border, readable ink. */
export const toneChip: Record<Tone, string> = {
  neutral: 'bg-fill border-line text-ink-muted',
  accent: 'bg-accent-soft border-accent-line text-accent-ink',
  accent2: 'bg-accent2-soft border-accent2-line text-accent2-ink',
  positive: 'bg-positive-soft border-positive-line text-positive-ink',
  caution: 'bg-caution-soft border-caution-line text-caution-ink',
  critical: 'bg-critical-soft border-critical-line text-critical-ink',
  info: 'bg-info-soft border-info-line text-info-ink',
};

/** Text only — for inline emphasis inside prose. */
export const toneText: Record<Tone, string> = {
  neutral: 'text-ink-muted',
  accent: 'text-accent-ink',
  accent2: 'text-accent2-ink',
  positive: 'text-positive-ink',
  caution: 'text-caution-ink',
  critical: 'text-critical-ink',
  info: 'text-info-ink',
};

/** Solid icon tile — used when the element is selected or primary. */
export const toneTile: Record<Tone, string> = {
  neutral: 'bg-fill-strong text-ink',
  accent: 'bg-accent text-accent-contrast',
  accent2: 'bg-accent2 text-ink-inverse',
  positive: 'bg-positive text-ink-inverse',
  caution: 'bg-caution text-ink-inverse',
  critical: 'bg-critical text-ink-inverse',
  info: 'bg-info text-ink-inverse',
};

/** 2px active indicator down the left edge of a nav row. */
export const toneRail: Record<Tone, string> = {
  neutral: 'bg-ink-faint',
  accent: 'bg-accent',
  accent2: 'bg-accent2',
  positive: 'bg-positive',
  caution: 'bg-caution',
  critical: 'bg-critical',
  info: 'bg-info',
};
