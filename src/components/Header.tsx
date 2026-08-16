import React, { useState } from 'react';
import { MasterProfile, AppTheme } from '../types';
import {
  Sparkles,
  Zap,
  Globe,
  UserCheck,
  ShieldCheck,
  Code2,
  Terminal,
  Activity,
  Layers,
  Palette,
  Check,
  Command,
  Sun,
  Moon,
  BarChart3,
  Cpu,
  HelpCircle
} from 'lucide-react';

interface HeaderProps {
  profile: MasterProfile;
  onOpenProfile: () => void;
  applicationsCount: number;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  currentTheme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenCommandPalette?: () => void;
  onOpenTelemetry?: () => void;
  onOpenIdentityVault?: () => void;
  onOpenOnboarding?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenProfile,
  applicationsCount,
  activeTab,
  onSelectTab,
  currentTheme,
  onChangeTheme,
  onOpenCommandPalette,
  onOpenTelemetry,
  onOpenIdentityVault,
  onOpenOnboarding,
  onStartTour
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  const darkThemes: { id: AppTheme; name: string; tag: string; gradient: string }[] = [
    { id: 'cyber', name: 'Cyber Aurora', tag: 'Obsidian Glow', gradient: 'from-violet-500 via-cyan-400 to-emerald-400' },
    { id: 'synthwave', name: 'Neon Synthwave', tag: 'Midnight Tokyo', gradient: 'from-pink-500 via-fuchsia-500 to-cyan-400' },
    { id: 'emerald', name: 'Quantum Emerald', tag: 'Forest Titanium', gradient: 'from-emerald-400 via-teal-400 to-blue-500' },
    { id: 'solar', name: 'Solar Ember', tag: 'Espresso Bronze', gradient: 'from-amber-400 via-orange-500 to-rose-500' },
    { id: 'slate', name: 'Executive Slate', tag: 'Carbon Steel', gradient: 'from-sky-400 via-blue-500 to-indigo-500' }
  ];

  const lightThemes: { id: AppTheme; name: string; tag: string; gradient: string }[] = [
    { id: 'light-executive', name: 'Executive Platinum', tag: 'Crisp Studio Light', gradient: 'from-indigo-600 via-sky-600 to-slate-800' },
    { id: 'light-frost', name: 'Nordic Frost Light', tag: 'Ice Cyan Modern', gradient: 'from-teal-600 via-cyan-600 to-emerald-600' },
    { id: 'light-ceramic', name: 'Warm Ceramic Light', tag: 'Alabaster Amber', gradient: 'from-amber-600 via-orange-600 to-rose-600' }
  ];

  const allThemes = [...darkThemes, ...lightThemes];
  const activeThemeObj = allThemes.find(t => t.id === currentTheme) || darkThemes[0];
  const isLight = currentTheme.startsWith('light-');

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#07090e]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
      {/* Left branding & System heartbeat */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]">
            <Zap className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07090e] shadow-[0_0_8px_#34d399]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold tracking-tight text-white uppercase flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  CHERENKOV NEXUS
                </span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/30 text-violet-300">
                QA-LEAD v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
              Agentic Career Engine & Multi-Agent QA Hub
            </p>
          </div>
        </div>

        {/* Live system indicators */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/[0.08] text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI AGENTS ONLINE</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">cherenkov-qa / Playwright / k6</span>
          </div>
        </div>
      </div>

      {/* Right controls: Command Palette Shortcut, Telemetry, Theme Picker & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            id="tour-command-palette"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 transition-all cursor-pointer group"
            title="Open Command Palette (Cmd+K)"
          >
            <Command className="w-3.5 h-3.5 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            <span className="text-[11px]">Command</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-black/40 border border-white/[0.1] rounded text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Magic Import & Vault Buttons */}
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600/20 to-cyan-500/20 hover:from-violet-600/30 hover:to-cyan-500/30 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Zero-Friction Agentic Onboarding (Terminal Handshake, Magic Ingest, Visa Seeding & Live ATS Test)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">Agentic Onboard</span>
          </button>
        )}

        {onOpenIdentityVault && (
          <button
            id="tour-identity-vault"
            onClick={onOpenIdentityVault}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
            title="Zero-Trust Identity Vault & Inference Router"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold">Vault</span>
          </button>
        )}

        {/* Guided Tour Trigger Button */}
        {onStartTour && (
          <button
            id="tour-guide-btn"
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-xs font-mono text-violet-300 transition-all cursor-pointer shadow-sm"
            title="Start Guided System Tour"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-bold hidden xl:inline">Tour</span>
          </button>
        )}

        {/* Telemetry Inspector Button */}
        {onOpenTelemetry && (
          <button
            id="tour-telemetry"
            onClick={onOpenTelemetry}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 transition-all cursor-pointer"
            title="System Telemetry & Scraper Health"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Metrics</span>
          </button>
        )}

        {/* Multi-Palette Theme Picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 transition-all cursor-pointer"
            title="Switch Visual Theme Palette & Mode"
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${activeThemeObj.gradient} shadow-sm ring-1 ring-white/20`} />
            <span className="hidden sm:inline text-[11px] font-semibold">
              {activeThemeObj.name.split(' ')[0]}
            </span>
            {isLight ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
            ) : (
              <Palette className="w-3.5 h-3.5 text-violet-400 ml-0.5" />
            )}
          </button>

          {showThemePicker && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0c101a] border border-white/[0.15] rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-2">
              {/* Dark Theme Group */}
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 flex items-center gap-1.5 font-bold">
                  <Moon className="w-3 h-3 text-violet-400" />
                  <span>Dark Modes (Aura Glow)</span>
                </div>
                <div className="space-y-1">
                  {darkThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeTheme(t.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        currentTheme === t.id
                          ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${t.gradient} ring-1 ring-white/20`} />
                        <div className="text-left">
                          <div className="text-xs">{t.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{t.tag}</div>
                        </div>
                      </div>
                      {currentTheme === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Light Theme Group */}
              <div className="pt-2 border-t border-white/[0.08]">
                <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 flex items-center gap-1.5 font-bold">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Light Modes (Crisp & Studio)</span>
                </div>
                <div className="space-y-1">
                  {lightThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeTheme(t.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        currentTheme === t.id
                          ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${t.gradient} ring-1 ring-black/20`} />
                        <div className="text-left">
                          <div className="text-xs">{t.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{t.tag}</div>
                        </div>
                      </div>
                      {currentTheme === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visa Sponsor Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visa Radar</span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 rounded">
            UK/EU
          </span>
        </div>

        {/* Master Profile Trigger Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/40 text-slate-200 transition-all group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            MB
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-200 group-hover:text-violet-300 transition-colors flex items-center gap-1">
              <span>Moayed Badawy</span>
              <UserCheck className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Senior QA Lead</div>
          </div>
        </button>
      </div>
    </header>
  );
};

