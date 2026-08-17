import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { McpPackage, McpCategory } from '../types';
import { INITIAL_MCP_PACKAGES } from '../data/initialData';
import { GitHubRepoSyncModal } from './GitHubRepoSyncModal';
import {
  Store,
  Download,
  CheckCircle2,
  Star,
  ExternalLink,
  Terminal,
  Cpu,
  Globe,
  Sliders,
  Sparkles,
  Zap,
  Filter,
  Search,
  Plus,
  ShieldCheck,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  Github,
  GitBranch,
  Code2,
  FileCode,
  Check
} from 'lucide-react';

export interface MarketplaceProps {
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onSyncSkillsToProfile?: (skills: string[]) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onToast, onSyncSkillsToProfile }) => {
  const [packages, setPackages] = useState<McpPackage[]>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_mcp_packages');
      return saved ? JSON.parse(saved) : INITIAL_MCP_PACKAGES;
    } catch {
      return INITIAL_MCP_PACKAGES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<McpCategory | 'all'>('all');
  const [selectedPackage, setSelectedPackage] = useState<McpPackage | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [linkedRepo, setLinkedRepo] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_linked_github_repo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Reload synced repo when modal closes or updates
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cherenkov_linked_github_repo');
      if (saved) {
        setLinkedRepo(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, [isGitHubModalOpen]);

  const [mcpLive, setMcpLive] = useState<{ ready: boolean; servers: Array<{ name: string; kind: string; connected: boolean; toolNames: string[] }> } | null>(null);

  useEffect(() => {
    fetch('/api/mcp/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMcpLive(data))
      .catch(() => setMcpLive(null));
  }, []);

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesCat = selectedCategory === 'all' || pkg.category === selectedCategory;
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        pkg.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [packages, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const installed = packages.filter((p) => p.installed).length;
    const active = packages.filter((p) => p.active).length;
    const totalDownloads = packages.reduce((acc, p) => acc + p.downloads, 0);
    return { installed, active, totalDownloads, total: packages.length };
  }, [packages]);

  const handleToggleInstall = (pkgId: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pkgId) {
          const nextInstalled = !p.installed;
          return {
            ...p,
            installed: nextInstalled,
            active: nextInstalled ? true : false,
            downloads: nextInstalled ? p.downloads + 1 : p.downloads
          };
        }
        return p;
      });
      localStorage.setItem('cherenkov_mcp_packages', JSON.stringify(updated));
      return updated;
    });

    const target = packages.find((p) => p.id === pkgId);
    if (target?.installed) {
      onToast('info', 'Package Uninstalled', `Disconnected MCP server ${target.name}`);
    } else {
      onToast('success', 'MCP Installed', `Spawned ${target?.name} in background stdio transport.`);
    }
  };

  const handleToggleActive = (pkgId: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pkgId && p.installed) {
          return { ...p, active: !p.active };
        }
        return p;
      });
      localStorage.setItem('cherenkov_mcp_packages', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0d121f] via-[#090d18] to-[#05070c] border border-cyan-500/25 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              <Store className="w-3.5 h-3.5" />
              <span>MCP 2026 OFFICIAL REGISTRY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Model Context Protocol & Strategy Marketplace
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dynamically augment your AI agent with official and community MCP connectors: Regional Visa
              Validators, Direct ATS Bypassers, and Senior QA Swarm Strategy Packs.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-violet-600/25 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Github className="w-4 h-4" />
              <span>{linkedRepo ? 'GitHub Synced' : 'GitHub Repository Sync'}</span>
              {linkedRepo && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Publish MCP Server</span>
            </button>
          </div>
        </div>

        {/* Live MCP Connector Status */}
        {(mcpLive || mcpLive === null) && (
          <div data-testid="mcp-live-status" className="mt-4 p-3.5 rounded-2xl bg-[#07090e]/80 border border-violet-500/25 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-300" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">
                LIVE MCP HOST
              </span>
            </div>
            {mcpLive ? (
              <div className="flex flex-wrap items-center gap-2">
                {mcpLive.servers.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-900/80 border border-slate-700 text-slate-300"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    {s.name}
                    <span className="text-slate-500">({s.toolNames.length} tools)</span>
                  </div>
                ))}
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  HOST {mcpLive.ready ? 'ONLINE' : 'DEGRADED'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                CONNECTING…
              </div>
            )}
          </div>
        )}

        {/* GitHub Codebase Alignment Hero Card */}
        <div className="mt-6 p-4 rounded-2xl bg-[#07090e]/80 border border-cyan-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold font-mono text-white">
                  {linkedRepo ? `Linked Repository: ${linkedRepo.repoName}` : 'GitHub Codebase AST Analyzer'}
                </h3>
                {linkedRepo ? (
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    {linkedRepo.alignmentScore}% TECHNICAL FIT
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-mono text-slate-400 bg-white/[0.05] rounded-full">
                    AIR-GAPPED AST SCAN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {linkedRepo
                  ? `Extracted ${linkedRepo.codeProofPoints?.length || 4} hard proof points (Playwright CDP, k6 spikes, CodeQL SAST) into candidate profile.`
                  : 'Link your GitHub repo to automatically extract test architecture proof points and align with enterprise JD criteria.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span>{linkedRepo ? 'Rescan / View Code Proof' : 'Link Repository'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Live Telemetry Stat Row */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.08] pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">{stats.installed} / {stats.total}</div>
              <div className="text-[11px] text-slate-400">Active Connectors</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400 font-mono">100% Stdio</div>
              <div className="text-[11px] text-slate-400">Zero-Egress Security</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-violet-300 font-mono">{(stats.totalDownloads / 1000).toFixed(1)}k</div>
              <div className="text-[11px] text-slate-400">Global Installs</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-300 font-mono">2026-07-28</div>
              <div className="text-[11px] text-slate-400">MCP Standard Spec</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0e17] border border-white/[0.06]">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Packages', count: packages.length },
              { id: 'visa', label: 'Visa Validators', count: packages.filter((p) => p.category === 'visa').length },
              { id: 'ats', label: 'ATS Connectors', count: packages.filter((p) => p.category === 'ats').length },
              { id: 'strategy', label: 'Strategy Packs', count: packages.filter((p) => p.category === 'strategy').length },
              { id: 'tool', label: 'LRS & Tools', count: packages.filter((p) => p.category === 'tool').length }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-[10px] opacity-75 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MCPs by name, tag, tech..."
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg) => {
          return (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl bg-gradient-to-b from-[#0e1322] to-[#090d16] border transition-all hover:border-cyan-500/40 flex flex-col justify-between group ${
                pkg.installed ? 'border-cyan-500/30 shadow-lg shadow-cyan-950/20' : 'border-white/[0.07]'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {pkg.category.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
                      {pkg.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                      <span>by {pkg.author}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">v{pkg.version}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{pkg.rating}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {pkg.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {pkg.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-slate-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Capabilities list preview */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Exposed MCP Tools</span>
                    <span className="text-cyan-400 lowercase">{pkg.transport} transport</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded"
                      >
                        {cap}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Inspect Spec</span>
                </button>

                <div className="flex items-center gap-2">
                  {pkg.installed && (
                    <button
                      onClick={() => handleToggleActive(pkg.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
                        pkg.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {pkg.active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleInstall(pkg.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      pkg.installed
                        ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md'
                    }`}
                  >
                    {pkg.installed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Installed</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Install MCP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Inspector Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-[#0d121f] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPackage.name}</h3>
                  <p className="text-xs text-slate-400">Author: {selectedPackage.author} • v{selectedPackage.version}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Description</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPackage.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Stdio Launch Command</h4>
                <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] text-xs font-mono text-cyan-300 mt-1.5 flex items-center justify-between">
                  <code>{selectedPackage.commandExample}</code>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Declared MCP Tool Signatures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                  {selectedPackage.capabilities.map((cap) => (
                    <div
                      key={cap}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-slate-200"
                    >
                      <span className="text-cyan-400">tool:</span> {cap}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <div className="text-xs text-slate-400 font-mono">
                Latency: <span className="text-emerald-400 font-bold">{selectedPackage.latencyMs || 25}ms</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleToggleInstall(selectedPackage.id);
                    setSelectedPackage(null);
                  }}
                  className="px-5 py-2 text-xs font-bold font-mono rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md"
                >
                  {selectedPackage.installed ? 'Uninstall MCP' : 'Install Connector'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Publish MCP Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[#0d121f] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-mono">Register Community MCP Server</h3>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Publish your custom Model Context Protocol server or Swarm strategy pack into your local registry.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400">Package Name</label>
                <input
                  type="text"
                  placeholder="e.g. Canada Express Entry MCP"
                  className="w-full px-3 py-2 mt-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400">Command / Stdio Endpoint</label>
                <input
                  type="text"
                  placeholder="npx -y @my-org/mcp-server@latest"
                  className="w-full px-3 py-2 mt-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400">Category</label>
                <select className="w-full px-3 py-2 mt-1 rounded-xl bg-[#090d16] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500">
                  <option value="visa">Regional Visa Validator</option>
                  <option value="ats">ATS Direct Connector</option>
                  <option value="strategy">Strategy Swarm Pack</option>
                  <option value="tool">LRS & Utility Tool</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onToast('success', 'MCP Registered', 'Custom MCP server added to local registry.');
                  setIsPublishModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold font-mono rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Publish to Local Registry
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* GitHub Repository Sync Modal */}
      <GitHubRepoSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onSyncSkillsToProfile={onSyncSkillsToProfile}
        onToast={onToast}
      />
    </div>
  );
};
