import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplicationCard, KanbanColumn, SynthesizedResult } from '../types';
import { Modal, chartStatus } from './ui';
import { KanbanMetrics } from './KanbanMetrics';
import { PerformanceMetrics } from './PerformanceMetrics';
import {
  Kanban,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Mail,
  Copy,
  Check,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit3,
  FileText,
  Building2,
  Clock,
  Sparkles,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  Send,
  Compass,
  Award,
  Layers,
  ArrowUpRight,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface KanbanBoardProps {
  applications: ApplicationCard[];
  onUpdateApplication: (app: ApplicationCard) => void;
  onDeleteApplication: (id: string) => void;
  onAddApplication: (app: ApplicationCard) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const COLUMNS: {
  id: KanbanColumn;
  name: string;
  border: string;
  badge: string;
  headerBg: string;
  glow: string;
  accentColor: string;
}[] = [
  {
    id: 'Saved',
    name: 'Saved Discovery',
    border: 'border-line-strong bg-surface/70',
    badge: 'bg-sunken/80 text-ink-muted border border-line-strong',
    headerBg: 'bg-fill-strong/10 text-ink-muted',
    glow: 'hover:border-line-strong',
    accentColor: chartStatus.neutral
  },
  {
    id: 'Upskilling',
    name: 'Upskilling In-Flight',
    border: 'border-caution-line bg-caution',
    badge: 'bg-caution-soft text-caution-ink border border-caution-line',
    headerBg: 'bg-caution-soft text-caution-ink',
    glow: 'hover:border-caution-line',
    accentColor: chartStatus.caution
  },
  {
    id: 'Ready to Apply',
    name: 'Ready to Pitch',
    border: 'border-accent-line bg-accent',
    badge: 'bg-accent-soft text-accent-ink border border-accent-line',
    headerBg: 'bg-accent-soft text-accent-ink',
    glow: 'hover:border-accent-line',
    accentColor: chartStatus.accent
  },
  {
    id: 'Applied',
    name: 'Submitted / Cold Sent',
    border: 'border-info-line bg-info',
    badge: 'bg-info-soft text-info-ink border border-info-line',
    headerBg: 'bg-info-soft text-info-ink',
    glow: 'hover:border-info-line',
    accentColor: chartStatus.info
  },
  {
    id: 'Interviewing',
    name: 'Active Interviews',
    border: 'border-positive-line bg-positive',
    badge: 'bg-positive-soft text-positive-ink border border-positive-line',
    headerBg: 'bg-positive-soft text-positive-ink',
    glow: 'hover:border-positive-line',
    accentColor: chartStatus.positive
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onUpdateApplication,
  onDeleteApplication,
  onAddApplication,
  onToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSponsorOnly, setFilterSponsorOnly] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeModalApp, setActiveModalApp] = useState<ApplicationCard | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});

  // New Application Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('London, UK / Remote (UK Sponsorship)');
  const [newSalary, setNewSalary] = useState('£95k - £115k');
  const [newColumn, setNewColumn] = useState<KanbanColumn>('Saved');
  const [newJd, setNewJd] = useState('');

  // Drag and drop state
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeys((prev) => ({ ...prev, [key]: true }));
    onToast('success', 'Copied', `${label} copied to clipboard.`);
    setTimeout(() => setCopiedKeys((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const handleMoveColumn = (app: ApplicationCard, newCol: KanbanColumn) => {
    const updated: ApplicationCard = {
      ...app,
      column: newCol,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    onUpdateApplication(updated);
    onToast('info', 'Stage Transitioned', `Moved ${app.company} to ${newCol}.`);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!id) return;

    const app = applications.find((a) => a.id === id);
    if (app && app.column !== column) {
      handleMoveColumn(app, column);
    }
    setDraggedAppId(null);
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newTitle.trim()) {
      onToast('error', 'Fields Required', 'Please enter at least Company and Job Title.');
      return;
    }

    const created: ApplicationCard = {
      id: `app-${Date.now()}`,
      jobTitle: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim(),
      salary: newSalary.trim() || undefined,
      column: newColumn,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      jobDescription: newJd.trim() || 'Manual entry',
      matchScore: 94
    };

    onAddApplication(created);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewCompany('');
    setNewJd('');
    onToast('success', 'Application Added', `Created ${created.company} in ${created.column}.`);
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.company.toLowerCase().includes(q) ||
      app.jobTitle.toLowerCase().includes(q) ||
      app.location.toLowerCase().includes(q);

    if (filterSponsorOnly) {
      return matchesSearch && app.synthesis?.isLicensedSponsor;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Pipeline Funnel */}
      <div className="p-6 rounded-panel bg-surface border border-info-line space-y-4 relative overflow-hidden">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-control bg-info text-ink">
                <Kanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Kanban Application Pipeline
              </h1>
              <span className="px-2.5 py-0.5 text-2xs font-mono font-bold bg-info-soft border border-info-line text-info-ink rounded-full">
                {applications.length} TOTAL TARGETS
              </span>
            </div>
            <p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
              5-stage tracking pipeline for Moayed's UK & EU sponsorship applications. Drag-and-drop cards between discovery, upskilling, ready pitches, and active rounds.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* View Mode Switcher */}
            <div className="p-1 rounded-card bg-fill border border-line flex items-center gap-1">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-control text-xs transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-accent text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="Board View" aria-label="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-control text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-accent text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="List View" aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-accent-contrast bg-accent hover:bg-accent-strong rounded-control transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Role</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-56 sm:w-72 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-info-ink" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by company, role, tech..."
                className="w-full pl-10 pr-3 py-2 text-xs bg-sunken border border-line rounded-control text-ink placeholder:text-ink-faint focus:border-info-line"
              />
            </div>

            <button
              onClick={() => setFilterSponsorOnly(!filterSponsorOnly)}
              className={`px-3.5 py-2 text-xs rounded-control font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterSponsorOnly
                  ? 'bg-positive-soft text-positive-ink border-positive-line'
                  : 'bg-fill text-ink-muted border-line hover:bg-fill-strong'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sponsor Only</span>
            </button>

            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`px-3.5 py-2 text-xs rounded-control font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                showMetrics
                  ? 'bg-accent-soft text-accent-ink border-accent-line'
                  : 'bg-fill text-ink-muted border-line hover:bg-fill-strong'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showMetrics ? 'Hide Analytics' : 'Show Telemetry & Velocity'}</span>
            </button>
          </div>

          {/* Quick Column Counts Pill Array */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {COLUMNS.map((col) => {
              const count = applications.filter((a) => a.column === col.id).length;
              return (
                <div
                  key={col.id}
                  className="px-3 py-1 rounded-control bg-fill border border-line flex items-center gap-2 text-ink-muted shrink-0"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accentColor }} />
                  <span>{col.name}:</span>
                  <span className="text-ink font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recharts Conversion & Velocity Telemetry Dashboard */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <PerformanceMetrics applications={applications} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODE: KANBAN BOARD */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[550px]">
          {COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => a.column === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-panel border ${col.border} p-3.5 flex flex-col gap-3 min-h-[540px] transition-all shadow-pop`}
              >
                {/* Column Header */}
                <div className="flex items-start justify-between gap-2 px-2 py-1.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ color: col.accentColor, backgroundColor: col.accentColor }}
                    />
                    <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider font-mono leading-4">
                      {col.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-2xs font-mono font-bold rounded-chip shrink-0 ${col.badge}`}
                  >
                    {colApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex flex-col gap-3 flex-1">
                  <AnimatePresence mode="popLayout">
                    {colApps.map((app) => (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0, y: 14, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 350,
                            damping: 25,
                            mass: 0.8
                          }
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                          y: -8,
                          transition: { duration: 0.16, ease: 'easeOut' }
                        }}
                        whileHover={{
                          y: -3,
                          scale: 1.01,
                          transition: { duration: 0.16 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, app.id)}
                        className="p-4 rounded-card bg-surface border border-line hover:border-accent-line transition-colors group cursor-grab active:cursor-grabbing space-y-3 relative overflow-hidden"
                      >
                        {/* Top Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-mono text-info-ink font-bold block truncate">
                              {app.company}
                            </span>
                            <h4 className="text-xs font-bold text-ink leading-snug mt-0.5 truncate">
                              {app.jobTitle}
                            </h4>
                          </div>

                          {app.matchScore && (
                            <span className="px-2 py-0.5 text-2xs font-mono font-bold bg-positive-soft border border-positive-line text-positive-ink rounded-control shrink-0">
                              {app.matchScore}%
                            </span>
                          )}
                        </div>

                        {/* Location & Meta Badges */}
                        <div className="flex flex-wrap gap-1 text-2xs">
                          <span className="px-2 py-0.5 bg-fill border border-line text-ink-muted rounded-control font-medium">
                            {app.location}
                          </span>
                          {app.synthesis?.isLicensedSponsor && (
                            <span className="px-2 py-0.5 bg-positive-soft border border-positive-line text-positive-ink rounded-control flex items-center gap-1 font-mono font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              UK Sponsor
                            </span>
                          )}
                        </div>

                        {/* Skill Gaps preview */}
                        {app.synthesis?.identified_skill_gaps &&
                          app.synthesis.identified_skill_gaps.length > 0 && (
                            <div className="text-2xs text-ink-muted truncate">
                              <span className="text-ink-faint">Target Gaps: </span>
                              <span className="text-caution-ink font-mono">
                                {app.synthesis.identified_skill_gaps.slice(0, 2).join(', ')}
                              </span>
                            </div>
                          )}

                        {/* Quick ATS & Actions */}
                        <div className="pt-2.5 border-t border-line flex items-center justify-between gap-1">
                          {app.synthesis ? (
                            <button
                              onClick={() => setActiveModalApp(app)}
                              className="text-xs font-bold text-accent-ink hover:text-accent-ink flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>View Pitch</span>
                            </button>
                          ) : (
                            <span className="text-2xs text-ink-faint italic">Direct Entry</span>
                          )}

                          <div className="flex items-center gap-1.5">
                            {/* Quick Column Mover Select */}
                            <select
                              value={app.column}
                              onChange={(e) => handleMoveColumn(app, e.target.value as KanbanColumn)}
                              className="text-2xs font-mono bg-sunken border border-line text-ink-muted rounded-control px-2 py-1 focus:border-accent-line"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  → {c.name}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              className="p-1 text-ink-faint hover:text-critical-ink transition-colors cursor-pointer"
                              title="Delete card" aria-label="Delete card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colApps.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex items-center justify-center border-2 border-dashed border-line rounded-card p-6 text-center"
                    >
                      <span className="text-xs text-ink-faint font-mono">Drag role card here</span>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE: HIGH-DENSITY LIST TABLE */}
      {viewMode === 'list' && (
        <div className="p-5 rounded-panel bg-surface border border-line overflow-x-auto shadow-pop">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-muted font-mono text-xs">
                <th className="pb-3 px-3 font-bold">Company & Target Role</th>
                <th className="pb-3 px-3 font-bold">Pipeline Stage</th>
                <th className="pb-3 px-3 font-bold">Match Score</th>
                <th className="pb-3 px-3 font-bold">Visa Sponsorship</th>
                <th className="pb-3 px-3 font-bold">Location & Comp</th>
                <th className="pb-3 px-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-fill transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-ink text-sm">{app.company}</div>
                    <div className="text-info-ink text-xs font-mono">{app.jobTitle}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 text-2xs font-mono font-bold bg-accent-soft border border-accent-line text-accent-ink rounded-control">
                      {app.column}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-positive-ink text-sm">
                    {app.matchScore || 95}%
                  </td>
                  <td className="py-3.5 px-3">
                    {app.synthesis?.isLicensedSponsor ? (
                      <span className="px-2.5 py-1 text-2xs font-mono bg-positive-soft text-positive-ink border border-positive-line rounded-control font-bold">
                        Licensed UK Sponsor
                      </span>
                    ) : (
                      <span className="text-ink-faint text-xs">Standard Registry</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-ink-muted">
                    <div>{app.location}</div>
                    <div className="text-2xs font-mono text-ink-muted">{app.salary || '£95k - £115k'}</div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.synthesis && (
                        <button
                          onClick={() => setActiveModalApp(app)}
                          className="px-3 py-1.5 text-xs bg-accent-soft hover:bg-accent/30 text-accent-contrast border border-accent-line rounded-control font-bold transition-all cursor-pointer"
                        >
                          View Pitch
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteApplication(app.id)}
                        className="p-1.5 text-ink-faint hover:text-critical-ink transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Synthesis Detail Modal */}
      <AnimatePresence>
        {activeModalApp && activeModalApp.synthesis && (
          <Modal open onClose={() => setActiveModalApp(null)} label="Application details">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-surface border border-accent-line rounded-panel shadow-pop overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-sunken">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-card bg-accent-soft text-accent-ink border border-accent-line flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink">{activeModalApp.company}</h3>
                    <p className="text-sm text-info-ink font-mono">{activeModalApp.jobTitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalApp(null)}
                  className="p-2 text-ink-muted hover:text-ink rounded-control hover:bg-fill-strong transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Tailored Summary */}
                <div className="p-5 rounded-card bg-sunken border border-line space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-accent-ink uppercase tracking-wider font-mono">
                      3-Sentence Resume Summary
                    </h4>
                    <button
                      onClick={() =>
                        handleCopy(
                          activeModalApp.synthesis!.tailored_summary,
                          'modal-summary',
                          'Summary'
                        )
                      }
                      className="px-3 py-1 text-xs bg-fill hover:bg-fill-strong text-ink rounded-control border border-line flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedKeys['modal-summary'] ? (
                        <Check className="w-3.5 h-3.5 text-positive-ink" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-accent-ink" />
                      )}
                      <span>Copy Summary</span>
                    </button>
                  </div>
                  <p className="text-sm text-ink leading-relaxed font-sans">
                    {activeModalApp.synthesis.tailored_summary}
                  </p>
                </div>

                {/* Cold Email */}
                <div className="p-5 rounded-card bg-sunken border border-line space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-info-ink uppercase tracking-wider font-mono">
                      Tailored Cold Email Pitch
                    </h4>
                    <button
                      onClick={() =>
                        handleCopy(
                          activeModalApp.synthesis!.cold_email,
                          'modal-email',
                          'Cold Email'
                        )
                      }
                      className="px-3 py-1 text-xs bg-fill hover:bg-fill-strong text-ink rounded-control border border-line flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedKeys['modal-email'] ? (
                        <Check className="w-3.5 h-3.5 text-positive-ink" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-info-ink" />
                      )}
                      <span>Copy Email</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono text-ink-muted whitespace-pre-wrap max-h-48 overflow-y-auto p-3.5 bg-sunken rounded-control border border-line leading-relaxed">
                    {activeModalApp.synthesis.cold_email}
                  </div>
                </div>

                {/* ATS Answers */}
                {activeModalApp.synthesis.ats_answers && activeModalApp.synthesis.ats_answers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                      Tailored ATS Screening Answers
                    </h4>
                    {activeModalApp.synthesis.ats_answers.map((qa, i) => (
                      <div key={i} className="p-4 rounded-card bg-sunken border border-line space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-ink flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-accent-soft text-accent-ink border border-accent-line text-2xs font-mono flex items-center justify-center shrink-0">
                              Q{i + 1}
                            </span>
                            {qa.question}
                          </span>
                          <button
                            onClick={() => handleCopy(qa.answer, `modal-ans-${i}`, `Answer ${i + 1}`)}
                            className="px-2.5 py-1 text-2xs bg-fill text-ink-muted rounded-control hover:bg-fill-strong flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedKeys[`modal-ans-${i}`] ? (
                              <Check className="w-3.5 h-3.5 text-positive-ink" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-accent-ink" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-sm text-ink-muted leading-relaxed bg-fill p-3 rounded-control">
                          {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add New Application Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal open onClose={() => setIsAddModalOpen(false)} label="Add a custom role">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-surface border border-accent-line rounded-panel shadow-pop overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-sunken">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent-ink" />
                  <span>Add Role to Pipeline</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-ink-muted hover:text-ink p-1 rounded-control hover:bg-fill-strong cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateApp} className="p-6 space-y-4">
                <div>
                  <label htmlFor="kanban-board-target-company-name" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                    Target Company Name
                  </label>
                  <input id="kanban-board-target-company-name"
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Wise, Stripe, Arm, BBC"
                    className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="kanban-board-target-job-title" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                    Target Job Title
                  </label>
                  <input id="kanban-board-target-job-title"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior QA Engineer / SDET Lead"
                    className="w-full px-3.5 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="kanban-board-location" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                      Location
                    </label>
                    <input id="kanban-board-location"
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line"
                    />
                  </div>
                  <div>
                    <label htmlFor="kanban-board-initial-stage" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                      Initial Stage
                    </label>
                    <select id="kanban-board-initial-stage"
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value as KanbanColumn)}
                      className="w-full px-3.5 py-2 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="kanban-board-job-description-snippet-notes" className="block text-xs font-bold text-ink-muted mb-1 font-mono uppercase">
                    Job Description Snippet / Notes
                  </label>
                  <textarea id="kanban-board-job-description-snippet-notes"
                    rows={3}
                    value={newJd}
                    onChange={(e) => setNewJd(e.target.value)}
                    placeholder="Paste snippet or brief notes..."
                    className="w-full p-3 text-xs bg-sunken border border-line rounded-control text-ink focus:border-accent-line"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-extrabold text-accent-contrast bg-accent hover:bg-accent-strong rounded-control cursor-pointer"
                  >
                    Create Card
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
