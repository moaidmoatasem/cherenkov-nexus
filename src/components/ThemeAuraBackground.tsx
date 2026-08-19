import React from 'react';
import { AppTheme } from '../types';

interface ThemeAuraBackgroundProps {
  /** Kept so the aura remounts (and re-eases) when the palette changes. */
  theme: AppTheme;
}

/**
 * Ambient light behind the whole product. The orb colours come from the
 * theme's `--color-aura-*` tokens, so a new palette needs no change here.
 * The blueprint grid is drawn by the `subtle-grid` utility on the app root.
 */
export const ThemeAuraBackground: React.FC<ThemeAuraBackgroundProps> = () => (
  <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
    <div
      className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full blur-[130px] animate-aurora"
      style={{ backgroundColor: 'var(--color-aura-1)' }}
    />
    <div
      className="absolute top-[18%] -right-44 w-[38rem] h-[38rem] rounded-full blur-[150px] animate-aurora"
      style={{ backgroundColor: 'var(--color-aura-2)', animationDelay: '-7s' }}
    />
    <div
      className="absolute -bottom-48 left-[22%] w-[40rem] h-[40rem] rounded-full blur-[160px] animate-glow-pulse"
      style={{ backgroundColor: 'var(--color-aura-3)' }}
    />
  </div>
);
