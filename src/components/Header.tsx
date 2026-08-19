import React, { useEffect, useRef, useState } from 'react';
import { MasterProfile, AppTheme } from '../types';
import {
  Activity,
  Check,
  Command,
  Globe,
  HelpCircle,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Badge, Button, cn } from './ui';

interface HeaderProps {
  profile: MasterProfile;
  onOpenProfile: () => void;
  currentTheme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenCommandPalette?: () => void;
  onOpenTelemetry?: () => void;
  onOpenIdentityVault?: () => void;
  onOpenOnboarding?: () => void;
  onStartTour?: () => void;
}

interface ThemeOption {
  id: AppTheme;
  name: string;
  tag: string;
  /**
   * A literal colour on purpose: the swatch previews the accent it switches
   * to, so it must not follow the accent currently in force. Themes differ by
   * accent alone, so one dot tells the whole truth.
   */
  swatch: string;
}

const DARK_THEMES: ThemeOption[] = [
  { id: 'cyber', name: 'Cyber Aurora', tag: 'Obsidian Glow', swatch: '#6e56cf' },
  { id: 'synthwave', name: 'Neon Synthwave', tag: 'Midnight Tokyo', swatch: '#cf5695' },
  { id: 'emerald', name: 'Quantum Emerald', tag: 'Forest Titanium', swatch: '#2f9e6e' },
  { id: 'solar', name: 'Solar Ember', tag: 'Espresso Bronze', swatch: '#c4801f' },
  { id: 'slate', name: 'Executive Slate', tag: 'Carbon Steel', swatch: '#4189c9' },
];

const LIGHT_THEMES: ThemeOption[] = [
  { id: 'light-executive', name: 'Executive Platinum', tag: 'Crisp Studio Light', swatch: '#5b53d8' },
  { id: 'light-frost', name: 'Nordic Frost Light', tag: 'Ice Cyan Modern', swatch: '#0d9488' },
  { id: 'light-ceramic', name: 'Warm Ceramic Light', tag: 'Alabaster Amber', swatch: '#c2620a' },
];

const swatchStyle = (colour: string): React.CSSProperties => ({
  backgroundColor: colour,
});

const ALL_THEMES = [...DARK_THEMES, ...LIGHT_THEMES];

/** "Moayed Badawy" → "MB". Falls back to the first glyph for single names. */
const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || '—';

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenProfile,
  currentTheme,
  onChangeTheme,
  onOpenCommandPalette,
  onOpenTelemetry,
  onOpenIdentityVault,
  onOpenOnboarding,
  onStartTour,
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const activeTheme = ALL_THEMES.find((t) => t.id === currentTheme) ?? DARK_THEMES[0];
  const isLight = currentTheme.startsWith('light-');

  // Dismiss the theme popover the way every other popover on the platform does.
  useEffect(() => {
    if (!showThemePicker) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) setShowThemePicker(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowThemePicker(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showThemePicker]);

  const renderThemeGroup = (label: string, icon: React.ReactNode, themes: ThemeOption[]) => (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1 eyebrow">
        {icon}
        <span>{label}</span>
      </div>
      {themes.map((theme) => {
        const selected = currentTheme === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => {
              onChangeTheme(theme.id);
              setShowThemePicker(false);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-control text-left',
              'transition-colors duration-150 cursor-pointer',
              selected ? 'bg-accent-soft' : 'hover:bg-fill'
            )}
          >
            <span
              style={swatchStyle(theme.swatch)}
              className="w-4 h-4 rounded-full shrink-0 ring-1 ring-line-strong"
            />
            <span className="min-w-0 flex-1">
              <span className={cn('block text-xs font-semibold truncate', selected ? 'text-ink' : 'text-ink-muted')}>
                {theme.name}
              </span>
              <span className="block text-[10px] font-mono text-ink-faint truncate">{theme.tag}</span>
            </span>
            {selected && <Check className="w-3.5 h-3.5 text-accent-ink shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-14 shrink-0 flex items-center gap-3 px-3 sm:px-5',
        'border-b border-line bg-canvas/85 backdrop-blur-xl'
      )}
    >
      {/* Identity ---------------------------------------------------------- */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex items-center justify-center w-8 h-8 rounded-control bg-accent text-accent-contrast shrink-0">
          <Zap className="w-4 h-4" />
          <span className="absolute -top-px -right-px w-2 h-2 rounded-full bg-positive ring-2 ring-canvas" />
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-bold tracking-tight text-ink whitespace-nowrap">
              CHERENKOV NEXUS
            </span>
            <span className="hidden sm:contents">
              <Badge tone="accent" font="mono">
                QA-LEAD v2.5
              </Badge>
            </span>
          </div>
          <p className="hidden lg:block text-[11px] leading-4 text-ink-faint whitespace-nowrap">
            Agentic Career Engine &amp; Multi-Agent QA Hub
          </p>
        </div>
      </div>

      {/* Live status — flexes into whatever room is left, then truncates ---- */}
      <div className="hidden xl:flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden pl-3 border-l border-line">
        <Badge tone="positive" dot font="mono">
          AI AGENTS ONLINE
        </Badge>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint min-w-0">
          <Terminal className="w-3.5 h-3.5 text-info-ink shrink-0" />
          <span className="truncate">cherenkov-qa / Playwright / k6</span>
        </span>
      </div>

      {/* Controls ---------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {onOpenCommandPalette && (
          <button
            id="tour-command-palette"
            type="button"
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Cmd+K)"
            className={cn(
              'hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-control cursor-pointer',
              'border border-line bg-fill text-ink-muted transition-colors duration-150',
              'hover:bg-fill-strong hover:text-ink hover:border-line-strong'
            )}
          >
            <Command className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Command</span>
            <kbd className="px-1.5 py-0.5 rounded-chip bg-sunken border border-line font-mono text-[10px] text-ink-faint">
              ⌘K
            </kbd>
          </button>
        )}

        {onOpenOnboarding && (
          <span className="hidden lg:contents">
            <Button
              variant="outline"
              onClick={onOpenOnboarding}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              title="Zero-Friction Agentic Onboarding (Terminal Handshake, Magic Ingest, Visa Seeding & Live ATS Test)"
            >
              Agentic Onboard
            </Button>
          </span>
        )}

        {/* Below 2xl these three collapse to icons rather than dropping out. */}
        {onOpenIdentityVault && (
          <span className="hidden md:contents">
            <Button
              id="tour-identity-vault"
              variant="ghost"
              onClick={onOpenIdentityVault}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              title="Zero-Trust Identity Vault & Inference Router"
            >
              <span className="hidden 2xl:inline">Vault</span>
            </Button>
          </span>
        )}

        {onStartTour && (
          <Button
            id="tour-guide-btn"
            variant="ghost"
            onClick={onStartTour}
            icon={<HelpCircle className="w-3.5 h-3.5" />}
            title="Start Guided System Tour"
          >
            <span className="hidden 2xl:inline">Tour</span>
          </Button>
        )}

        {onOpenTelemetry && (
          <span className="hidden md:contents">
            <Button
              id="tour-telemetry"
              variant="ghost"
              onClick={onOpenTelemetry}
              icon={<Activity className="w-3.5 h-3.5" />}
              title="System Telemetry & Scraper Health"
            >
              <span className="hidden 2xl:inline">Metrics</span>
            </Button>
          </span>
        )}

        {/* Theme picker ---------------------------------------------------- */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setShowThemePicker((open) => !open)}
            title="Switch Visual Theme Palette & Mode"
            aria-haspopup="menu"
            aria-expanded={showThemePicker}
            className={cn(
              'flex items-center gap-2 h-8 px-2.5 rounded-control cursor-pointer',
              'border border-line bg-fill text-ink-muted transition-colors duration-150',
              'hover:bg-fill-strong hover:text-ink hover:border-line-strong'
            )}
          >
            <span
              style={swatchStyle(activeTheme.swatch)}
              className="w-3.5 h-3.5 rounded-full ring-1 ring-line-strong"
            />
            <span className="hidden sm:inline text-xs font-semibold">{activeTheme.name.split(' ')[0]}</span>
            {isLight ? <Sun className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
          </button>

          {showThemePicker && (
            <div
              role="menu"
              className={cn(
                'absolute right-0 mt-2 w-72 p-1.5 z-50',
                'rounded-card border border-line-strong bg-elevated shadow-pop'
              )}
            >
              {renderThemeGroup(
                'Dark Modes (Aura Glow)',
                <Moon className="w-3 h-3" />,
                DARK_THEMES
              )}
              <div className="my-1 border-t border-line" />
              {renderThemeGroup(
                'Light Modes (Crisp & Studio)',
                <Sun className="w-3 h-3" />,
                LIGHT_THEMES
              )}
            </div>
          )}
        </div>

        <span className="hidden 2xl:contents">
          <Badge tone="positive" icon={<Globe className="w-3.5 h-3.5" />} className="h-8 px-2.5">
            Visa Radar <span className="font-mono">UK/EU</span>
          </Badge>
        </span>

        {/* Profile --------------------------------------------------------- */}
        <button
          type="button"
          onClick={onOpenProfile}
          title={`${profile.name} — ${profile.title}`}
          className={cn(
            'flex items-center gap-2.5 h-9 pl-1 pr-1 sm:pr-2.5 rounded-control cursor-pointer',
            'border border-line bg-fill transition-colors duration-150',
            'hover:bg-fill-strong hover:border-accent-line group'
          )}
        >
          <span className="w-7 h-7 rounded-chip bg-accent text-accent-contrast flex items-center justify-center text-[11px] font-bold shrink-0">
            {initialsOf(profile.name)}
          </span>
          <span className="hidden md:block text-left min-w-0 max-w-[9.5rem]">
            <span className="flex items-center gap-1 text-xs font-semibold text-ink group-hover:text-accent-ink transition-colors">
              <span className="truncate">{profile.name}</span>
              <UserCheck className="w-3 h-3 text-info-ink shrink-0" />
            </span>
            <span className="block text-[10px] font-mono text-ink-faint truncate">{profile.title}</span>
          </span>
        </button>
      </div>
    </header>
  );
};
