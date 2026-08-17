import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Kanban,
  GraduationCap,
  Palette,
  Terminal,
  ShieldCheck,
  Zap,
  Globe,
  Share2,
  BookOpen,
  ArrowRight,
  Command,
  Sun,
  Moon,
  Activity,
  FileCode,
  Check,
  Linkedin,
  Mic,
  HelpCircle
} from 'lucide-react';
import { AppTheme, TabId, CandidateArchetype } from '../types';
import { SAMPLE_JOBS, ARCHETYPE_PRESETS } from '../data/initialData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
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
    // Workspaces
    {
      id: 'ws-synth',
      title: 'Go to Job Synthesizer & Weaponry Arsenal',
      category: 'Workspace',
      description: 'Ingest JDs, synthesize STAR answers, and tailor pitches',
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      badge: 'Tab 1',
      action: () => {
        onSelectTab('synthesizer');
        onClose();
      }
    },
    {
      id: 'ws-kanban',
      title: 'Go to Kanban Application Pipeline',
      category: 'Workspace',
      description: '5-Stage visual tracking of visa-sponsored job opportunities',
      icon: <Kanban className="w-4 h-4 text-cyan-400" />,
      badge: 'Tab 2',
      action: () => {
        onSelectTab('kanban');
        onClose();
      }
    },
    {
      id: 'ws-learning',
      title: 'Go to Learning Sync Matrix',
      category: 'Workspace',
      description: 'Review in-flight courses and auto-propagate acquired skills',
      icon: <GraduationCap className="w-4 h-4 text-amber-400" />,
      badge: 'Tab 3',
      action: () => {
        onSelectTab('learning');
        onClose();
      }
    },
    {
      id: 'ws-marketplace',
      title: 'Go to MCP Registry & Strategy Marketplace',
      category: 'Workspace',
      description: 'Browse, install, and manage official and community Model Context Protocol packages',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      badge: 'PaaS',
      action: () => {
        onSelectTab('marketplace');
        onClose();
      }
    },
    {
      id: 'ws-orchestrator',
      title: 'Go to Visual Agent Canvas & Swarm Builder',
      category: 'Workspace',
      description: 'Design and execute multi-agent workflows with human approval gates',
      icon: <Zap className="w-4 h-4 text-violet-400" />,
      badge: 'Swarm',
      action: () => {
        onSelectTab('orchestrator');
        onClose();
      }
    },
    {
      id: 'ws-hivemind',
      title: 'Go to Community Hive-Mind & Ghost Job Radar',
      category: 'Workspace',
      description: 'Crowdsourced hiring signals, monthly visa heatmaps, and ATS telemetry',
      icon: <Activity className="w-4 h-4 text-red-400" />,
      badge: 'Radar',
      action: () => {
        onSelectTab('hivemind');
        onClose();
      }
    },

    // Actions
    {
      id: 'act-linkedin-scout',
      title: 'Run LinkedIn Scout MCP Agent',
      category: 'Action',
      description: 'Extract recruiter profiles and generate hyper-personalized cold outreach',
      icon: <Linkedin className="w-4 h-4 text-cyan-400" />,
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
      icon: <Mic className="w-4 h-4 text-violet-400" />,
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
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
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
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
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
      icon: <Zap className="w-4 h-4 text-amber-400" />,
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
      icon: <HelpCircle className="w-4 h-4 text-violet-400" />,
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
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
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
      icon: <Moon className="w-4 h-4 text-violet-400" />,
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
      icon: <Moon className="w-4 h-4 text-pink-400" />,
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
      icon: <Moon className="w-4 h-4 text-emerald-400" />,
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
      icon: <Moon className="w-4 h-4 text-amber-400" />,
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
      icon: <Moon className="w-4 h-4 text-sky-400" />,
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
      icon: <Sun className="w-4 h-4 text-indigo-500" />,
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
      icon: <Sun className="w-4 h-4 text-teal-500" />,
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
      icon: <Sun className="w-4 h-4 text-amber-600" />,
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
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0c101a] border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-[#090c15]">
          <Search className="w-5 h-5 text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search role preset, change theme, or jump to workspace..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />
          <kbd className="px-2 py-1 text-[10px] font-mono bg-white/[0.06] text-slate-400 border border-white/[0.1] rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.04]">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-cyan-600/10 border border-violet-500/30 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-violet-600/30 text-white shadow-inner' : 'bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      {cmd.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        {cmd.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {cmd.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="p-3 border-t border-white/[0.08] bg-[#090c15] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-300">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>CHERENKOV COMMAND PALETTE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
