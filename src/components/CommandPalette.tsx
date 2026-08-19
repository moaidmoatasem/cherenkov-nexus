import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  Sun,
  Moon,
  Activity,
  Linkedin,
  Mic,
  HelpCircle
} from 'lucide-react';
import { AppTheme, CandidateArchetype, TabId } from '../types';
import { SAMPLE_JOBS, ARCHETYPE_PRESETS } from '../data/initialData';
import { Modal } from './ui';
import { WORKSPACES } from '../navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  onOpenProfile: () => void;
  onSelectTheme: (theme: AppTheme) => void;
  onLoadPreset: (company: string) => void;
  onSelectArchetype?: (archetype: CandidateArchetype) => void;
  onOpenTelemetry: () => void;
  currentTheme: AppTheme;
  onOpenIdentityVault?: () => void;
  onOpenOnboarding?: () => void;
  onStartTour?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Workspace' | 'Action' | 'Theme' | 'Presets' | 'System';
  description: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenProfile,
  onSelectTheme,
  onLoadPreset,
  onSelectArchetype,
  onOpenTelemetry,
  currentTheme,
  onOpenIdentityVault,
  onOpenOnboarding,
  onStartTour
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const commands: CommandItem[] = [
    // Workspaces — generated from the one registry in `navigation.tsx`, so a
    // module is reachable from the palette the moment it is declared. Hand
    // maintaining this list is how the Sponsorship Oracle went missing.
    ...WORKSPACES.map((workspace, index): CommandItem => ({
      id: `ws-${workspace.id}`,
      title: `Go to ${workspace.name}`,
      category: 'Workspace',
      description: workspace.subtitle,
      icon: workspace.icon,
      badge: `Tab ${index + 1}`,
      action: () => {
        onSelectTab(workspace.id);
        onClose();
      },
    })),


    // Actions
    {
      id: 'act-linkedin-scout',
      title: 'Run LinkedIn Scout MCP Agent',
      category: 'Action',
      description: 'Extract recruiter profiles and generate hyper-personalized cold outreach',
      icon: <Linkedin className="w-4 h-4 text-info-ink" />,
      badge: 'MCP 2026',
      action: () => {
        onSelectTab('synthesizer');
        onClose();
      }
    },
    {
      id: 'act-voice-interview',
      title: 'Launch Voice Mock Interview Sandbox',
      category: 'Action',
      description: 'Interactive technical Q&A drill powered by Web Speech API & AI Evaluator',
      icon: <Mic className="w-4 h-4 text-accent-ink" />,
      badge: 'Voice TTS',
      action: () => {
        onSelectTab('synthesizer');
        onClose();
      }
    },
    {
      id: 'act-profile',
      title: 'Edit Master Profile & Skills Ground Truth',
      category: 'Action',
      description: 'Update Playwright/k6/cherenkov-qa anchor experience',
      icon: <ShieldCheck className="w-4 h-4 text-positive-ink" />,
      action: () => {
        onOpenProfile();
        onClose();
      }
    },
    {
      id: 'act-identity-vault',
      title: 'Open Zero-Trust Identity Vault & Router',
      category: 'Action',
      description: 'Manage AES-256 E2EE storage, PII isolation, and verifiable crypto badges',
      icon: <ShieldCheck className="w-4 h-4 text-info-ink" />,
      badge: 'AES-256',
      action: () => {
        if (onOpenIdentityVault) onOpenIdentityVault();
        onClose();
      }
    },
    {
      id: 'act-onboarding-magic',
      title: 'Magic Profile Import & 1-Click Cloud Deploy',
      category: 'Action',
      description: 'Instant parsing of public profile URL and one-click cloud self-host scripts',
      icon: <Zap className="w-4 h-4 text-caution-ink" />,
      badge: '10-Sec',
      action: () => {
        if (onOpenOnboarding) onOpenOnboarding();
        onClose();
      }
    },
    {
      id: 'act-tour-start',
      title: 'Start Interactive Guided Feature Tour',
      category: 'System',
      description: 'Explore Command Palette, xAPI Sync Webhook, Identity Vault, and Agent Swarm',
      icon: <HelpCircle className="w-4 h-4 text-accent-ink" />,
      badge: 'Interactive Tour',
      action: () => {
        if (onStartTour) onStartTour();
        onClose();
      }
    },
    {
      id: 'act-telemetry',
      title: 'Inspect Scraper Health & Telemetry Metrics',
      category: 'System',
      description: 'View Playwright latency, UK Sponsor registry stats, and AST validation',
      icon: <Activity className="w-4 h-4 text-positive-ink" />,
      action: () => {
        onOpenTelemetry();
        onClose();
      }
    },

    // Themes
    {
      id: 'th-cyber',
      title: 'Switch to Cyber Aurora Theme (Dark)',
      category: 'Theme',
      description: 'Deep obsidian canvas with radiant violet/cyan aurora',
      icon: <Moon className="w-4 h-4 text-accent-ink" />,
      badge: currentTheme === 'cyber' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('cyber');
        onClose();
      }
    },
    {
      id: 'th-synthwave',
      title: 'Switch to Tokyo Neon Synthwave (Dark)',
      category: 'Theme',
      description: 'Midnight indigo with vibrant fuchsia & electric cyan',
      icon: <Moon className="w-4 h-4 text-critical-ink" />,
      badge: currentTheme === 'synthwave' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('synthwave');
        onClose();
      }
    },
    {
      id: 'th-emerald',
      title: 'Switch to Quantum Emerald Theme (Dark)',
      category: 'Theme',
      description: 'Forest titanium with radiant emerald and teal accents',
      icon: <Moon className="w-4 h-4 text-positive-ink" />,
      badge: currentTheme === 'emerald' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('emerald');
        onClose();
      }
    },
    {
      id: 'th-solar',
      title: 'Switch to Solar Ember Theme (Dark)',
      category: 'Theme',
      description: 'Dark espresso bronze with molten amber glow',
      icon: <Moon className="w-4 h-4 text-caution-ink" />,
      badge: currentTheme === 'solar' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('solar');
        onClose();
      }
    },
    {
      id: 'th-slate',
      title: 'Switch to Executive Slate Theme (Dark)',
      category: 'Theme',
      description: 'Deep carbon titanium with cool steel blue aura',
      icon: <Moon className="w-4 h-4 text-info-ink" />,
      badge: currentTheme === 'slate' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('slate');
        onClose();
      }
    },
    {
      id: 'th-light-exec',
      title: 'Switch to Executive Platinum Theme (Light)',
      category: 'Theme',
      description: 'Crisp studio light mode with cobalt accents & crystal cards',
      icon: <Sun className="w-4 h-4 text-info" />,
      badge: currentTheme === 'light-executive' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('light-executive');
        onClose();
      }
    },
    {
      id: 'th-light-frost',
      title: 'Switch to Nordic Frost Theme (Light)',
      category: 'Theme',
      description: 'Pure ice gray canvas with sharp cyan & emerald highlights',
      icon: <Sun className="w-4 h-4 text-info" />,
      badge: currentTheme === 'light-frost' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('light-frost');
        onClose();
      }
    },
    {
      id: 'th-light-ceramic',
      title: 'Switch to Warm Ceramic Theme (Light)',
      category: 'Theme',
      description: 'Alabaster warmth with terracotta & bronze accents',
      icon: <Sun className="w-4 h-4 text-caution" />,
      badge: currentTheme === 'light-ceramic' ? 'Active' : undefined,
      action: () => {
        onSelectTheme('light-ceramic');
        onClose();
      }
    },

    // Candidate Archetype Presets
    ...((Object.keys(ARCHETYPE_PRESETS) as CandidateArchetype[]).map((key) => {
      const p = ARCHETYPE_PRESETS[key];
      return {
        id: `archetype-${key}`,
        title: `Switch Profile Archetype: ${p.label}`,
        category: 'Presets' as const,
        description: `${p.badge} • ${p.tagline}`,
        icon: <Sparkles className="w-4 h-4" style={{ color: p.accentColor }} />,
        badge: p.badge,
        action: () => {
          if (onSelectArchetype) {
            onSelectArchetype(key);
          }
          onClose();
        }
      };
    })),

    // Job Presets
    ...SAMPLE_JOBS.map((job) => ({
      id: `preset-${job.company.toLowerCase()}`,
      title: `Load Verified Role Preset: ${job.company} - ${job.title}`,
      category: 'Presets' as const,
      description: `UK Skilled Worker Licensed Sponsor • ${job.location}`,
      icon: <Globe className="w-4 h-4 text-info-ink" />,
      badge: 'UK Sponsor',
      action: () => {
        onSelectTab('synthesizer');
        onLoadPreset(job.company);
        onClose();
      }
    }))
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchTarget = `${cmd.title} ${cmd.category} ${cmd.description}`.toLowerCase();
    return searchTarget.includes(query.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} align="top" label="Command palette">
      <div
        className="w-full max-w-2xl bg-surface border border-accent-line rounded-panel shadow-pop overflow-hidden flex flex-col max-h-[75vh] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-line flex items-center gap-3 bg-sunken">
          <Search className="w-5 h-5 text-accent-ink shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded
            aria-controls="command-palette-results"
            aria-activedescendant={
              filteredCommands[selectedIndex] ? `command-${filteredCommands[selectedIndex].id}` : undefined
            }
            placeholder="Type a command, search role preset, change theme, or jump to workspace..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint font-medium"
          />
          <kbd className="px-2 py-1 text-[10px] font-mono bg-fill-strong text-ink-muted border border-line rounded-control">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Commands"
          className="overflow-y-auto p-2 space-y-1 divide-y divide-line"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted font-mono">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  id={`command-${cmd.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  ref={isSelected ? selectedRef : undefined}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-card flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-accent border border-accent-line text-ink'
                      : 'text-ink-muted hover:bg-fill border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-control shrink-0 ${
                        isSelected ? 'bg-accent/30 text-ink' : 'bg-fill text-ink-muted'
                      }`}
                    >
                      {cmd.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        {cmd.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent-soft text-accent-ink border border-accent-line font-bold">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-fill text-ink-muted border border-line">
                      {cmd.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-info-ink animate-pulse" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="p-3 border-t border-line bg-sunken flex items-center justify-between text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <div className="flex items-center gap-1.5 text-accent-ink">
            <Zap className="w-3.5 h-3.5 text-accent-ink" />
            <span>CHERENKOV COMMAND PALETTE</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
