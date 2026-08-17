import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ApplicationCard, KanbanColumn, SynthesizedResult } from '../types';
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
    border: 'border-slate-500/20 bg-[#0c101a]/70',
    badge: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    headerBg: 'bg-slate-500/10 text-slate-300',
    glow: 'hover:border-slate-400/40',
    accentColor: '#94a3b8'
  },
  {
    id: 'Upskilling',
    name: 'Upskilling In-Flight',
    border: 'border-amber-500/25 bg-gradient-to-b from-amber-950/15 via-[#0c101a]/70 to-[#07090e]',
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    headerBg: 'bg-amber-500/15 text-amber-300',
    glow: 'hover:border-amber-400/40',
    accentColor: '#f59e0b'
  },
  {
    id: 'Ready to Apply',
    name: 'Ready to Pitch',
    border: 'border-violet-500/30 bg-gradient-to-b from-violet-950/20 via-[#0c101a]/70 to-[#07090e]',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
    headerBg: 'bg-violet-500/20 text-violet-300',
    glow: 'hover:border-violet-400/50',
    accentColor: '#8b5cf6'
  },
  {
    id: 'Applied',
    name: 'Submitted / Cold Sent',
    border: 'border-cyan-500/25 bg-gradient-to-b from-cyan-950/15 via-[#0c101a]/70 to-[#07090e]',
    badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    headerBg: 'bg-cyan-500/15 text-cyan-300',
    glow: 'hover:border-cyan-400/40',
    accentColor: '#06b6d4'
  },
  {
    id: 'Interviewing',
    name: 'Active Interviews',
    border: 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-[#0c101a]/70 to-[#07090e]',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    headerBg: 'bg-emerald-500/20 text-emerald-300',
    glow: 'hover:border-emerald-400/50',
    accentColor: '#10b981'
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
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0e1324] via-[#0d101c] to-[#07090e] border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-br from-cyan-600/10 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30">
                <Kanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Kanban Application Pipeline
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-full">
                {applications.length} TOTAL TARGETS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              5-stage tracking pipeline for Moayed's UK & EU sponsorship applications. Drag-and-drop cards between discovery, upskilling, ready pitches, and active rounds.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* View Mode Switcher */}
            <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-1 shadow-md">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Role</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by company, role, tech..."
                className="w-full pl-10 pr-3 py-2 text-xs bg-[#07090e] border border-white/[0.1] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => setFilterSponsorOnly(!filterSponsorOnly)}
              className={`px-3.5 py-2 text-xs rounded-xl font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterSponsorOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sponsor Only</span>
            </button>

            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`px-3.5 py-2 text-xs rounded-xl font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                showMetrics
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showMetrics ? 'Hide Analytics' : 'Show Telemetry & Velocity'}</span>
            </button>
          </div>

          {/* Quick Column Counts Pill Array */}
          <div className="flex items-center gap-2 text-[11px] font-mono overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {COLUMNS.map((col) => {
              const count = applications.filter((a) => a.column === col.id).length;
              return (
                <div
                  key={col.id}
                  className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 text-slate-300 shrink-0"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accentColor }} />
                  <span>{col.name}:</span>
                  <span className="text-white font-bold">{count}</span>
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
                className={`rounded-3xl border ${col.border} p-3.5 flex flex-col gap-3 min-h-[540px] transition-all shadow-xl`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ color: col.accentColor, backgroundColor: col.accentColor }} />
                    <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
                      {col.name}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg ${col.badge}`}>
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
                        className="p-4 rounded-2xl bg-[#0c101a] border border-white/[0.08] hover:border-violet-500/40 transition-colors shadow-lg group cursor-grab active:cursor-grabbing space-y-3 relative overflow-hidden"
                      >
                        {/* Top Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-mono text-cyan-400 font-bold block truncate">
                              {app.company}
                            </span>
                            <h4 className="text-xs font-bold text-white leading-snug mt-0.5 truncate">
                              {app.jobTitle}
                            </h4>
                          </div>

                          {app.matchScore && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg shrink-0">
                              {app.matchScore}%
                            </span>
                          )}
                        </div>

                        {/* Location & Meta Badges */}
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-lg font-medium">
                            {app.location}
                          </span>
                          {app.synthesis?.isLicensedSponsor && (
                            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-1 font-mono font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              UK Sponsor
                            </span>
                          )}
                        </div>

                        {/* Skill Gaps preview */}
                        {app.synthesis?.identified_skill_gaps &&
                          app.synthesis.identified_skill_gaps.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate">
                              <span className="text-slate-500">Target Gaps: </span>
                              <span className="text-amber-300 font-mono">
                                {app.synthesis.identified_skill_gaps.slice(0, 2).join(', ')}
                              </span>
                            </div>
                          )}

                        {/* Quick ATS & Actions */}
                        <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-1">
                          {app.synthesis ? (
                            <button
                              onClick={() => setActiveModalApp(app)}
                              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>View Pitch</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Direct Entry</span>
                          )}

                          <div className="flex items-center gap-1.5">
                            {/* Quick Column Mover Select */}
                            <select
                              value={app.column}
                              onChange={(e) => handleMoveColumn(app, e.target.value as KanbanColumn)}
                              className="text-[10px] font-mono bg-[#07090e] border border-white/[0.08] text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  → {c.name}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete card"
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
                      className="flex-1 flex items-center justify-center border-2 border-dashed border-white/[0.04] rounded-2xl p-6 text-center"
                    >
                      <span className="text-xs text-slate-600 font-mono">Drag role card here</span>
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
        <div className="p-5 rounded-3xl bg-[#0c101a] border border-white/[0.08] overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px]">
                <th className="pb-3 px-3 font-bold">Company & Target Role</th>
                <th className="pb-3 px-3 font-bold">Pipeline Stage</th>
                <th className="pb-3 px-3 font-bold">Match Score</th>
                <th className="pb-3 px-3 font-bold">Visa Sponsorship</th>
                <th className="pb-3 px-3 font-bold">Location & Comp</th>
                <th className="pb-3 px-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white text-sm">{app.company}</div>
                    <div className="text-cyan-400 text-xs font-mono">{app.jobTitle}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-lg">
                      {app.column}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-400 text-sm">
                    {app.matchScore || 95}%
                  </td>
                  <td className="py-3.5 px-3">
                    {app.synthesis?.isLicensedSponsor ? (
                      <span className="px-2.5 py-1 text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold">
                        Licensed UK Sponsor
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Standard Registry</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div>{app.location}</div>
                    <div className="text-[10px] font-mono text-slate-400">{app.salary || '£95k - £115k'}</div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {app.synthesis && (
                        <button
                          onClick={() => setActiveModalApp(app)}
                          className="px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          View Pitch
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteApplication(app.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c101a] border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#07090e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center shadow-md">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{activeModalApp.company}</h3>
                    <p className="text-xs text-cyan-400 font-mono">{activeModalApp.jobTitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalApp(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Tailored Summary */}
                <div className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-mono">
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
                      className="px-3 py-1 text-xs bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-lg border border-white/[0.08] flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedKeys['modal-summary'] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-violet-400" />
                      )}
                      <span>Copy Summary</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {activeModalApp.synthesis.tailored_summary}
                  </p>
                </div>

                {/* Cold Email */}
                <div className="p-5 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
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
                      className="px-3 py-1 text-xs bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-lg border border-white/[0.08] flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedKeys['modal-email'] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>Copy Email</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto p-3.5 bg-black/50 rounded-xl border border-white/[0.04] leading-relaxed">
                    {activeModalApp.synthesis.cold_email}
                  </div>
                </div>

                {/* ATS Answers */}
                {activeModalApp.synthesis.ats_answers && activeModalApp.synthesis.ats_answers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      Tailored ATS Screening Answers
                    </h4>
                    {activeModalApp.synthesis.ats_answers.map((qa, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/30 text-[10px] font-mono flex items-center justify-center shrink-0">
                              Q{i + 1}
                            </span>
                            {qa.question}
                          </span>
                          <button
                            onClick={() => handleCopy(qa.answer, `modal-ans-${i}`, `Answer ${i + 1}`)}
                            className="px-2.5 py-1 text-[10px] bg-white/[0.04] text-slate-300 rounded-lg hover:bg-white/[0.08] flex items-center gap-1 shrink-0 cursor-pointer font-mono"
                          >
                            {copiedKeys[`modal-ans-${i}`] ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-violet-400" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl">
                          {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Application Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-[#0c101a] border border-violet-500/30 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#07090e]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" />
                  <span>Add Role to Pipeline</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateApp} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                    Target Company Name
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Wise, Stripe, Arm, BBC"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior QA Engineer / SDET Lead"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                      Initial Stage
                    </label>
                    <select
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value as KanbanColumn)}
                      className="w-full px-3.5 py-2 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
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
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">
                    Job Description Snippet / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newJd}
                    onChange={(e) => setNewJd(e.target.value)}
                    placeholder="Paste snippet or brief notes..."
                    className="w-full p-3 text-xs bg-[#07090e] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-xl shadow-md shadow-violet-600/30 cursor-pointer"
                  >
                    Create Card
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
