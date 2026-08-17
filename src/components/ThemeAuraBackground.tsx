import React from 'react';
import { AppTheme } from '../types';

interface ThemeAuraBackgroundProps {
  theme: AppTheme;
}

export const ThemeAuraBackground: React.FC<ThemeAuraBackgroundProps> = ({ theme }) => {
  // Theme-specific radiant aura colors and glow intensities
  const getAuraStyles = () => {
    switch (theme) {
      case 'synthwave':
        return {
          blob1: 'bg-pink-600/25',
          blob2: 'bg-fuchsia-600/25',
          blob3: 'bg-cyan-500/20',
          blob4: 'bg-purple-700/20',
          accentBorder: 'rgba(236, 72, 153, 0.2)',
          gridOpacity: 'opacity-20'
        };
      case 'emerald':
        return {
          blob1: 'bg-emerald-500/25',
          blob2: 'bg-teal-500/25',
          blob3: 'bg-cyan-600/20',
          blob4: 'bg-blue-700/15',
          accentBorder: 'rgba(16, 185, 129, 0.2)',
          gridOpacity: 'opacity-20'
        };
      case 'solar':
        return {
          blob1: 'bg-amber-500/25',
          blob2: 'bg-orange-600/25',
          blob3: 'bg-rose-600/20',
          blob4: 'bg-yellow-600/15',
          accentBorder: 'rgba(245, 158, 11, 0.2)',
          gridOpacity: 'opacity-20'
        };
      case 'slate':
        return {
          blob1: 'bg-sky-500/20',
          blob2: 'bg-indigo-600/20',
          blob3: 'bg-blue-600/15',
          blob4: 'bg-slate-700/20',
          accentBorder: 'rgba(56, 189, 248, 0.15)',
          gridOpacity: 'opacity-20'
        };
      case 'light-executive':
        return {
          blob1: 'bg-indigo-500/15',
          blob2: 'bg-sky-400/15',
          blob3: 'bg-violet-400/15',
          blob4: 'bg-emerald-400/10',
          accentBorder: 'rgba(99, 102, 241, 0.15)',
          gridOpacity: 'opacity-10'
        };
      case 'light-frost':
        return {
          blob1: 'bg-teal-400/18',
          blob2: 'bg-cyan-400/18',
          blob3: 'bg-emerald-400/15',
          blob4: 'bg-sky-300/15',
          accentBorder: 'rgba(13, 148, 136, 0.15)',
          gridOpacity: 'opacity-10'
        };
      case 'light-ceramic':
        return {
          blob1: 'bg-amber-400/18',
          blob2: 'bg-orange-300/18',
          blob3: 'bg-rose-300/15',
          blob4: 'bg-yellow-400/15',
          accentBorder: 'rgba(217, 119, 6, 0.15)',
          gridOpacity: 'opacity-10'
        };
      case 'cyber':
      default:
        return {
          blob1: 'bg-violet-600/25',
          blob2: 'bg-indigo-600/25',
          blob3: 'bg-cyan-500/20',
          blob4: 'bg-emerald-500/15',
          accentBorder: 'rgba(139, 92, 246, 0.2)',
          gridOpacity: 'opacity-20'
        };
    }
  };

  const aura = getAuraStyles();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* High-Tech Blueprint Matrix Grid */}
      <div
        className={`absolute inset-0 ${aura.gridOpacity} transition-opacity duration-700`}
        style={{
          backgroundImage: `
            linear-gradient(to right, ${aura.accentBorder} 1px, transparent 1px),
            linear-gradient(to bottom, ${aura.accentBorder} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Dynamic Animated Ambient Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[120px] transition-all duration-1000 ${aura.blob1} animate-aurora`}
      />

      <div
        className={`absolute top-[20%] -right-40 w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-1000 ${aura.blob2} animate-aurora`}
        style={{ animationDelay: '-6s' }}
      />

      <div
        className={`absolute bottom-[-10%] left-[25%] w-[650px] h-[650px] rounded-full blur-[150px] transition-all duration-1000 ${aura.blob3} animate-aurora`}
        style={{ animationDelay: '-12s' }}
      />

      <div
        className={`absolute top-[45%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] transition-all duration-1000 ${aura.blob4} animate-glow-pulse`}
      />

      {/* Subtle top spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
    </div>
  );
};
