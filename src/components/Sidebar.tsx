import React, { useState } from 'react';
import { MasterProfile, ApplicationCard } from '../types';
import {
  Sparkles,
  Kanban,
  GraduationCap,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Bookmark,
  Send,
  HelpCircle,
  Flame,
  Award,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export type TabId = 'synthesizer' | 'kanban' | 'learning' | 'marketplace' | 'orchestrator' | 'hivemind';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  profile: MasterProfile;
  onOpenProfile: () => void;
  applications: ApplicationCard[];
  certCount: number;
  onOpenIdentityVault?: () => void;
  onOpenOnboarding?: () => void;
  onStartTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  onOpenProfile,
  applications,
  certCount,
  onOpenIdentityVault,
  onOpenOnboarding,
  onStartTour
}) => {
  const [chartView, setChartView] = useState<'pipeline' | 'learning'>('pipeline');

  const coreTabs = [
    {
      id: 'synthesizer' as TabId,
      name: 'Job Synthesizer',
      subtitle: 'ATS Match & Weaponry Arsenal',
      icon: <Sparkles className="w-4 h-4" />,
      badge: 'AI Engine',
      badgeClass: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
      activeGradient: 'from-violet-950/50 via-indigo-900/30 to-transparent border-violet-500/40 shadow-violet-950/40',
      iconActiveBg: 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-600/40',
      indicatorColor: 'bg-violet-400 shadow-[0_0_10px_#a78bfa]'
    },
    {
      id: 'kanban' as TabId,
      name: 'Kanban Pipeline',
      subtitle: '5-Stage Tracker & Velocity',
      icon: <Kanban className="w-4 h-4" />,
      badge: `${applications.length} Roles`,
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      activeGradient: 'from-cyan-950/50 via-sky-900/30 to-transparent border-cyan-500/40 shadow-cyan-950/40',
      iconActiveBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/40',
      indicatorColor: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
    },
    {
      id: 'learning' as TabId,
      name: 'Learning Sync',
      subtitle: 'Skill Matrix & xAPI LRS',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: `${certCount} Active`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      activeGradient: 'from-amber-950/50 via-orange-900/30 to-transparent border-amber-500/40 shadow-amber-950/40',
      iconActiveBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/40',
      indicatorColor: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
    }
  ];

  const paasTabs = [
    {
      id: 'marketplace' as TabId,
      name: 'MCP Marketplace',
      subtitle: 'Registry & Stdio Servers',
      icon: <Layers className="w-4 h-4" />,
      badge: '2026 Spec',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      activeGradient: 'from-cyan-950/50 via-teal-900/30 to-transparent border-cyan-500/40 shadow-cyan-950/40',
      iconActiveBg: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-cyan-500/40',
      indicatorColor: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
    },
    {
      id: 'orchestrator' as TabId,
      name: 'Agent Canvas',
      subtitle: 'Visual Swarm & Human Gate',
      icon: <Cpu className="w-4 h-4" />,
      badge: 'Swarm',
      badgeClass: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
      activeGradient: 'from-violet-950/50 via-indigo-900/30 to-transparent border-violet-500/40 shadow-violet-950/40',
      iconActiveBg: 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-violet-600/40',
      indicatorColor: 'bg-violet-400 shadow-[0_0_10px_#c084fc]'
    },
    {
      id: 'hivemind' as TabId,
      name: 'Community Radar',
      subtitle: 'Ghost Jobs & Visa Heatmap',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'Live Telemetry',
      badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
      activeGradient: 'from-red-950/50 via-pink-900/30 to-transparent border-red-500/40 shadow-red-950/40',
      iconActiveBg: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/40',
      indicatorColor: 'bg-rose-400 shadow-[0_0_10px_#fb7185]'
    }
  ];

  // Pipeline distribution calculation
  const stageCounts = {
    Saved: applications.filter((a) => a.column === 'Saved').length,
    Upskilling: applications.filter((a) => a.column === 'Upskilling').length,
    'Ready to Apply': applications.filter((a) => a.column === 'Ready to Apply').length,
    Applied: applications.filter((a) => a.column === 'Applied').length,
    Interviewing: applications.filter((a) => a.column === 'Interviewing').length
  };

  const pipelineChartData = [
    { name: 'Saved', count: stageCounts.Saved, fill: '#94a3b8' },
    { name: 'Upskill', count: stageCounts.Upskilling, fill: '#f59e0b' },
    { name: 'Ready', count: stageCounts['Ready to Apply'], fill: '#8b5cf6' },
    { name: 'Sent', count: stageCounts.Applied, fill: '#06b6d4' },
    { name: 'Interv.', count: stageCounts.Interviewing, fill: '#10b981' }
  ];

  const completedCerts = (profile.learning_certs || []).filter((c) => c.status === 'Completed').length;
  const inProgressCerts = (profile.learning_certs || []).filter((c) => c.status === 'In Progress').length;
  const injectedSkillsCount = profile.tech_stack.length;

  const learningChartData = [
    { name: 'Verified', count: completedCerts, fill: '#10b981' },
    { name: 'In-Flight', count: inProgressCerts, fill: '#f59e0b' },
    { name: 'Total Stack', count: injectedSkillsCount, fill: '#06b6d4' }
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#07090e]/95 border-r border-white/[0.08] flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4 space-y-5 overflow-y-auto">
      {/* Navigation tabs */}
      <div className="space-y-4">
        {/* Core Workspaces */}
        <div>
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>Core Workspaces</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.08] text-cyan-400 font-mono">
              3 APPS
            </span>
          </div>

          <nav className="space-y-1.5">
            {coreTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 group relative cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${tab.activeGradient} border text-white shadow-lg`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg transition-all ${
                      isActive
                        ? `${tab.iconActiveBg} shadow-md`
                        : 'bg-white/[0.04] text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.08]'
                    }`}
                  >
                    {tab.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {tab.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-medium ${tab.badgeClass}`}>
                        {tab.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {tab.subtitle}
                    </p>
                  </div>

                  {isActive && (
                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${tab.indicatorColor}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 2026 PaaS & Multi-Agent Swarm Ecosystem */}
        <div>
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>PaaS & Agent Swarm</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono">
              MCP 2026
            </span>
          </div>

          <nav className="space-y-1.5">
            {paasTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 group relative cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${tab.activeGradient} border text-white shadow-lg`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg transition-all ${
                      isActive
                        ? `${tab.iconActiveBg} shadow-md`
                        : 'bg-white/[0.04] text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.08]'
                    }`}
                  >
                    {tab.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {tab.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-medium ${tab.badgeClass}`}>
                        {tab.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {tab.subtitle}
                    </p>
                  </div>

                  {isActive && (
                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${tab.indicatorColor}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Launchers: Identity Vault & Magic Import */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenIdentityVault}
            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer text-center"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Zero-Trust Vault</span>
          </button>

          <button
            onClick={onOpenOnboarding}
            className="p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer text-center"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Magic Import</span>
          </button>
        </div>

        {/* Mini Recharts Analytics Dashboard */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#0c101c] to-[#07090e] border border-cyan-500/20 shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wide">
                Live Analytics
              </span>
            </div>

            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.08]">
              <button
                onClick={() => setChartView('pipeline')}
                className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-all ${
                  chartView === 'pipeline'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pipeline Distribution"
              >
                Pipeline
              </button>
              <button
                onClick={() => setChartView('learning')}
                className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-all ${
                  chartView === 'learning'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Learning Sync"
              >
                Learning
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-28 w-full relative">
            {chartView === 'pipeline' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07090e',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#f1f5f9'
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learningChartData} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={65}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07090e',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#f1f5f9'
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {learningChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{applications.length} Active Targets</span>
            <span className="text-emerald-400 font-bold">
              {applications.filter(a => a.column === 'Interviewing').length} Interviewing
            </span>
          </div>
        </div>

        {/* Master Profile Source of Truth Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#0e1322] to-[#0a0d16] border border-violet-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono tracking-wide">
                Master Anchor
              </span>
            </div>
            <button
              onClick={onOpenProfile}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5 font-medium transition-colors cursor-pointer"
            >
              <span>Edit</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="text-white font-semibold truncate text-[12px]">{profile.name}</div>
            <div className="text-[10px] text-cyan-400 font-mono font-medium">{profile.title}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{profile.location}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono font-bold">Visa Ready</span>
            </div>
          </div>

          {/* Quick tech stack tags with colored accents */}
          <div className="pt-2 border-t border-white/[0.08]">
            <div className="text-[9px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Synchronized Stack</span>
              <span className="text-emerald-400 font-bold">{profile.tech_stack.length} SKILLS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.tech_stack.slice(0, 5).map((tech, idx) => {
                const colors = [
                  'bg-violet-500/10 text-violet-300 border-violet-500/20',
                  'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
                  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                  'bg-amber-500/10 text-amber-300 border-amber-500/20'
                ];
                const color = colors[idx % colors.length];
                return (
                  <span
                    key={tech}
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded ${color}`}
                  >
                    {tech}
                  </span>
                );
              })}
              {profile.tech_stack.length > 5 && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.06] text-slate-300 border border-white/[0.1] rounded">
                  +{profile.tech_stack.length - 5}
                </span>
              )}
            </div>
          </div>

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-violet-600/15 via-cyan-500/15 to-emerald-500/15 hover:from-violet-600/25 hover:to-emerald-500/25 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Agentic Onboarding Hub</span>
            </button>
          )}

          {onStartTour && (
            <button
              onClick={onStartTour}
              className="w-full mt-1.5 py-1.5 px-2.5 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 border border-white/[0.08] hover:border-violet-500/30 text-[10px] font-mono font-bold text-violet-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-violet-400" />
              <span>System Guided Tour</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-[#0b0e17] border border-white/[0.06] text-[10px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-slate-400 text-[9px] uppercase font-bold">CHERENKOV PIPELINE</span>
          <span className="text-emerald-400 text-[9px] font-mono flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ONLINE
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Autonomous tailoring & UK sponsorship verification.
        </p>
      </div>
    </aside>
  );
};

