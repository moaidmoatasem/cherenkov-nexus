import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { McpPackage, McpCategory } from '../types';
import { INITIAL_MCP_PACKAGES } from '../data/initialData';
import { GitHubRepoSyncModal } from './GitHubRepoSyncModal';
import {
  Store,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Terminal,
  Sliders,
  Zap,
  Search,
  Plus,
  ShieldCheck,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  Github,
  Code2,
  Check
} from 'lucide-react';
import { Modal } from './ui';
import type { ToastFn } from './Toast';

export interface MarketplaceProps {
  onToast: ToastFn;
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
  const [draftPackage, setDraftPackage] = useState<{
    name: string;
    command: string;
    category: McpCategory;
  }>({ name: '', command: '', category: 'visa' });
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
  const [mcpManifest, setMcpManifest] = useState<{ schemaVersion?: string; version?: string } | null>(null);

  useEffect(() => {
    fetch('/api/mcp/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMcpLive(data))
      .catch(() => setMcpLive(null));

    // The spec version the gateway actually advertises, rather than a date
    // typed into the markup.
    fetch('/api/mcp/manifest')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMcpManifest(data))
      .catch(() => setMcpManifest(null));
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
    const enabled = packages.filter((p) => p.installed).length;
    const active = packages.filter((p) => p.active).length;
    return { enabled, active, total: packages.length };
  }, [packages]);

  /** Servers and tools the gateway is genuinely holding open right now. */
  const liveHost = useMemo(() => {
    const servers = mcpLive?.servers ?? [];
    const connected = servers.filter((s) => s.connected);
    return {
      known: servers.length,
      connected: connected.length,
      tools: connected.reduce((acc, s) => acc + s.toolNames.length, 0),
      stdio: connected.filter((s) => s.kind === 'stdio').length
    };
  }, [mcpLive]);

  const handleToggleInstall = (pkgId: string) => {
    setPackages((prev) => {
      const updated = prev.map((p) =>
        p.id === pkgId ? { ...p, installed: !p.installed, active: !p.installed } : p
      );
      localStorage.setItem('cherenkov_mcp_packages', JSON.stringify(updated));
      return updated;
    });

    // Flipping this flag records a preference in this browser. It does not
    // spawn a process, which is what the previous toast announced.
    const target = packages.find((p) => p.id === pkgId);
    if (target?.installed) {
      onToast('info', 'Removed from catalogue', `${target.name} is no longer marked enabled.`);
    } else {
      onToast(
        'info',
        'Marked enabled',
        `${target?.name} is saved as enabled in this browser. Connected servers are listed under Live MCP Host.`
      );
    }
  };

  /**
   * Add the entry the form describes to the catalogue.
   *
   * The form used to discard everything typed into it and toast "Custom MCP
   * server added to local registry" regardless, so the list never changed.
   */
  const handlePublish = () => {
    const name = draftPackage.name.trim();
    const command = draftPackage.command.trim();
    if (!name || !command) {
      onToast('error', 'Missing details', 'A catalogue entry needs both a name and a launch command.');
      return;
    }

    const entry: McpPackage = {
      id: `local-${Date.now().toString(36)}`,
      name,
      version: '0.1.0',
      author: 'Added in this workspace',
      category: draftPackage.category,
      description: `Local catalogue entry. Declared launch command: ${command}`,
      tags: ['Local'],
      installed: true,
      active: true,
      transport: 'stdio',
      commandExample: command,
      capabilities: []
    };

    setPackages((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem('cherenkov_mcp_packages', JSON.stringify(updated));
      return updated;
    });
    setDraftPackage({ name: '', command: '', category: 'visa' });
    setIsPublishModalOpen(false);
    onToast(
      'success',
      'Added to catalogue',
      `${name} is listed and marked enabled in this browser. Nothing was started.`
    );
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
      <div className="p-8 rounded-panel bg-surface border border-info-line relative overflow-hidden shadow-pop">

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fill border border-line text-ink-muted text-xs font-mono font-bold">
              <Store className="w-3.5 h-3.5" />
              <span>BUNDLED CATALOGUE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Model Context Protocol & Strategy Marketplace
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              A catalogue of MCP connectors — regional visa validators, ATS board readers and
              strategy packs — that you can mark as enabled for this workspace. What is
              actually connected right now is shown under Live MCP Host below.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="px-4 py-2.5 rounded-card bg-accent hover:bg-accent-strong text-accent-contrast text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Github className="w-4 h-4" />
              <span>{linkedRepo ? 'GitHub Synced' : 'GitHub Repository Sync'}</span>
              {linkedRepo && (
                <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2.5 rounded-card bg-accent hover:bg-accent-strong text-accent-contrast text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Publish MCP Server</span>
            </button>
          </div>
        </div>

        {/* Live MCP Connector Status */}
        {(mcpLive || mcpLive === null) && (
          <div data-testid="mcp-live-status" className="mt-4 p-3.5 rounded-card bg-sunken/80 border border-accent-line flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-accent-ink" />
              <span className="text-2xs font-mono font-bold tracking-widest text-ink-muted">
                LIVE MCP HOST
              </span>
            </div>
            {mcpLive ? (
              <div className="flex flex-wrap items-center gap-2">
                {mcpLive.servers.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-control text-2xs font-mono font-bold bg-sunken/80 border border-line-strong text-ink-muted"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.connected ? 'bg-positive animate-pulse' : 'bg-critical'
                      }`}
                    />
                    {s.name}
                    <span className="text-ink-faint">({s.toolNames.length} tools)</span>
                  </div>
                ))}
                <span
                  className={`text-2xs font-mono font-bold flex items-center gap-1 ${
                    mcpLive.ready ? 'text-positive-ink' : 'text-caution-ink'
                  }`}
                >
                  {mcpLive.ready ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  HOST {mcpLive.ready ? 'ONLINE' : 'DEGRADED'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-2xs font-mono font-bold text-caution-ink">
                <RefreshCw className="w-3 h-3 animate-spin" />
                CONNECTING…
              </div>
            )}
          </div>
        )}

        {/* GitHub Codebase Alignment Hero Card */}
        <div className="mt-6 p-4 rounded-card bg-sunken/80 border border-info-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-control bg-info-soft border border-info-line text-info-ink">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold font-mono text-ink">
                  {linkedRepo ? `Linked Repository: ${linkedRepo.repoName}` : 'GitHub Codebase AST Analyzer'}
                </h3>
                {linkedRepo ? (
                  <span className="px-2 py-0.5 text-2xs font-mono font-bold bg-positive-soft text-positive-ink border border-positive-line rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    {linkedRepo.alignmentScore}% TECHNICAL FIT
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-2xs font-mono text-ink-muted bg-fill rounded-full">
                    AIR-GAPPED AST SCAN
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                {linkedRepo
                  ? `Extracted ${linkedRepo.codeProofPoints?.length || 4} hard proof points (Playwright CDP, k6 spikes, CodeQL SAST) into candidate profile.`
                  : 'Link your GitHub repo to automatically extract test architecture proof points and align with enterprise JD criteria.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className="px-4 py-2 rounded-control text-xs font-bold bg-fill-strong hover:bg-fill-strong text-info-ink border border-info-line flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <span>{linkedRepo ? 'Rescan / View Code Proof' : 'Link Repository'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/*
          Every tile below is either counted from the catalogue on screen or read
          from the gateway. The row previously advertised a "Global Installs"
          figure summed from per-package download counts that nothing produced —
          and which went up by one when you clicked Install yourself.
        */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-fill text-ink-muted border border-line">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-ink font-mono">{stats.enabled} / {stats.total}</div>
              <div className="text-xs text-ink-muted">Marked enabled here</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div data-testid="mcp-stat-servers" className="text-xl font-bold text-ink font-mono">
                {mcpLive ? `${liveHost.connected} / ${liveHost.known}` : '—'}
              </div>
              <div className="text-xs text-ink-muted">Servers connected</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-accent-soft text-accent-ink border border-accent-line">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div data-testid="mcp-stat-tools" className="text-xl font-bold text-ink font-mono">
                {mcpLive ? liveHost.tools : '—'}
              </div>
              <div className="text-xs text-ink-muted">Live tools exposed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-fill text-ink-muted border border-line">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div data-testid="mcp-stat-spec" className="text-xl font-bold text-ink font-mono">
                {mcpManifest?.schemaVersion ?? '—'}
              </div>
              <div className="text-xs text-ink-muted">Gateway spec version</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-card bg-sunken border border-line">
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
              className={`px-3 py-1.5 rounded-control text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-info text-ink'
                  : 'bg-fill hover:bg-fill-strong text-ink-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-2xs opacity-75 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MCPs by name, tag, tech..."
            className="w-full pl-9 pr-4 py-2 bg-fill border border-line rounded-control text-xs text-ink placeholder:text-ink-faint focus:border-info-line"
          />
        </div>
      </div>

      {/* Package Grid */}
      <p data-testid="catalogue-note" className="text-sm text-ink-muted">
        These entries are a bundled catalogue describing connectors and the tools they
        expose. Enabling one saves a preference in this browser — it does not start a
        server. The Live MCP Host strip above is the authoritative list of what is running.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg) => {
          return (
            <div
              key={pkg.id}
              data-testid="mcp-package-card"
              className={`p-6 rounded-panel bg-surface border transition-all hover:border-info-line flex flex-col justify-between group ${
                pkg.installed ? 'border-info-line' : 'border-line'
              }`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-2xs font-mono font-bold uppercase tracking-wider text-info-ink px-2 py-0.5 rounded bg-info-soft border border-info-line">
                      {pkg.category.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-2 group-hover:text-info-ink transition-colors">
                      {pkg.name}
                    </h3>
                    <div className="text-xs text-ink-muted flex items-center gap-2 mt-1">
                      <span>by {pkg.author}</span>
                      <span>•</span>
                      <span className="font-mono text-2xs">v{pkg.version}</span>
                    </div>
                  </div>

                  {pkg.githubUrl && (
                    <a
                      href={pkg.githubUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1 text-ink-muted hover:text-ink text-2xs font-mono shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Source</span>
                    </a>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-ink-muted line-clamp-3 leading-relaxed">
                  {pkg.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {pkg.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-control bg-fill border border-line text-2xs text-ink-muted font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Capabilities list preview */}
                <div className="p-3 rounded-card bg-sunken border border-line space-y-1.5">
                  <div className="text-2xs font-mono text-ink-muted font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Exposed MCP Tools</span>
                    <span className="text-info-ink lowercase">{pkg.transport} transport</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-2xs font-mono bg-info-soft text-info-ink px-1.5 py-0.5 rounded"
                      >
                        {cap}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Inspect Spec</span>
                </button>

                <div className="flex items-center gap-2">
                  {pkg.installed && (
                    <button
                      onClick={() => handleToggleActive(pkg.id)}
                      className={`px-2.5 py-1.5 rounded-control text-xs font-bold font-mono transition-all cursor-pointer ${
                        pkg.active
                          ? 'bg-positive-soft text-positive-ink border border-positive-line'
                          : 'bg-sunken text-ink-muted border border-line-strong'
                      }`}
                    >
                      {pkg.active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleInstall(pkg.id)}
                    className={`px-3.5 py-1.5 rounded-control text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      pkg.installed
                        ? 'bg-critical-soft hover:bg-critical-soft text-critical-ink border border-critical-line'
                        : 'bg-accent hover:bg-accent-strong text-accent-contrast'
                    }`}
                  >
                    {pkg.installed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Enable</span>
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
        <Modal open onClose={() => setSelectedPackage(null)} label="MCP package details">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-surface border border-info-line rounded-panel p-6 shadow-pop space-y-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-card bg-info-soft text-info-ink border border-info-line">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{selectedPackage.name}</h3>
                  <p className="text-sm text-ink-muted">Author: {selectedPackage.author} • v{selectedPackage.version}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-ink-muted hover:text-ink p-1 rounded-control text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase">Description</h4>
                <p className="text-sm text-ink-muted mt-1 leading-relaxed">{selectedPackage.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase">Stdio Launch Command</h4>
                <div className="p-3 rounded-control bg-sunken border border-line text-xs font-mono text-info-ink mt-1.5 flex items-center justify-between">
                  <code>{selectedPackage.commandExample}</code>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase">Declared MCP Tool Signatures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                  {selectedPackage.capabilities.map((cap) => (
                    <div
                      key={cap}
                      className="p-2.5 rounded-control bg-fill border border-line text-xs font-mono text-ink"
                    >
                      <span className="text-info-ink">tool:</span> {cap}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <div className="text-xs text-ink-muted font-mono">
                {typeof selectedPackage.latencyMs === 'number' ? (
                  <>Catalogue latency note: {selectedPackage.latencyMs}ms</>
                ) : (
                  <>No latency recorded for this entry</>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:text-ink cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleToggleInstall(selectedPackage.id);
                    setSelectedPackage(null);
                  }}
                  className="px-5 py-2 text-xs font-bold rounded-control bg-accent hover:bg-accent-strong text-accent-contrast-inverse cursor-pointer"
                >
                  {selectedPackage.installed ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </motion.div>
        </Modal>
      )}

      {/* Publish MCP Modal */}
      {isPublishModalOpen && (
        <Modal open onClose={() => setIsPublishModalOpen(false)} label="Register community MCP server">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-surface border border-info-line rounded-panel p-6 shadow-pop space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink font-mono">Register Community MCP Server</h3>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-ink-muted hover:text-ink text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-ink-muted">
              Add your own Model Context Protocol server or strategy pack to this workspace's
              catalogue. The entry is saved in this browser; no server is started and nothing
              is published anywhere.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="marketplace-package-name" className="text-xs font-mono text-ink-muted">Package Name</label>
                <input id="marketplace-package-name"
                  type="text"
                  value={draftPackage.name}
                  onChange={(e) => setDraftPackage((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Canada Express Entry MCP"
                  className="w-full px-3 py-2 mt-1 rounded-control bg-fill border border-line text-xs text-ink focus:border-info-line"
                />
              </div>

              <div>
                <label htmlFor="marketplace-command-stdio-endpoint" className="text-xs font-mono text-ink-muted">Command / Stdio Endpoint</label>
                <input id="marketplace-command-stdio-endpoint"
                  type="text"
                  value={draftPackage.command}
                  onChange={(e) => setDraftPackage((d) => ({ ...d, command: e.target.value }))}
                  placeholder="npx -y @my-org/mcp-server@latest"
                  className="w-full px-3 py-2 mt-1 rounded-control bg-fill border border-line text-xs text-ink focus:border-info-line font-mono"
                />
              </div>

              <div>
                <label htmlFor="marketplace-category" className="text-xs font-mono text-ink-muted">Category</label>
                <select
                  id="marketplace-category"
                  value={draftPackage.category}
                  onChange={(e) =>
                    setDraftPackage((d) => ({ ...d, category: e.target.value as McpCategory }))
                  }
                  className="w-full px-3 py-2 mt-1 rounded-control bg-sunken border border-line text-xs text-ink focus:border-info-line"
                >
                  <option value="visa">Regional Visa Validator</option>
                  <option value="ats">ATS Direct Connector</option>
                  <option value="strategy">Strategy Swarm Pack</option>
                  <option value="tool">LRS & Utility Tool</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2 text-xs font-bold font-mono rounded-control bg-accent hover:bg-accent-strong text-accent-contrast-inverse"
              >
                Add to Catalogue
              </button>
            </div>
          </motion.div>
        </Modal>
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
