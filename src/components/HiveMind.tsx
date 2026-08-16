import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GhostJobSignal, VisaHeatmapItem, AtsHealthStatus } from '../types';
import {
  INITIAL_GHOST_JOBS,
  INITIAL_VISA_HEATMAP,
  INITIAL_ATS_HEALTH
} from '../data/initialData';
import {
  Radio,
  Ghost,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Flame,
  Globe,
  TrendingUp,
  Building2,
  CheckCircle2,
  Clock,
  EyeOff,
  Sparkles,
  Users,
  Search,
  Filter
} from 'lucide-react';

export interface HiveMindProps {
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const HiveMind: React.FC<HiveMindProps> = ({ onToast }) => {
  const [ghostJobs] = useState<GhostJobSignal[]>(INITIAL_GHOST_JOBS);
  const [visaHeatmap] = useState<VisaHeatmapItem[]>(INITIAL_VISA_HEATMAP);
  const [atsHealth] = useState<AtsHealthStatus[]>(INITIAL_ATS_HEALTH);
  const [isTelemetryOptIn, setIsTelemetryOptIn] = useState(true);
  const [activeTab, setActiveTab] = useState<'ghost_radar' | 'visa_heatmap' | 'ats_health'>('ghost_radar');

  const handleToggleOptIn = () => {
    const next = !isTelemetryOptIn;
    setIsTelemetryOptIn(next);
    onToast(
      'info',
      next ? 'Hive-Mind Enabled' : 'Hive-Mind Disabled',
      next ? 'Contributing anonymous telemetry to global radar.' : 'Local offline mode enforced.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#090d18] to-[#06080e] border border-cyan-500/25 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>COMMUNITY HIVE-MIND RADAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Crowdsourced Hiring Telemetry & Ghost Job Radar
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time collective intelligence mapping ghost postings, active UK/EU sponsorship confirmations, and ATS accessibility selector health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
              <div>
                <div className="text-xs font-bold text-white">Anonymous Telemetry</div>
                <div className="text-[10px] text-slate-400">Zero PII Egress Guarantee</div>
              </div>
              <button
                onClick={handleToggleOptIn}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isTelemetryOptIn ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isTelemetryOptIn ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Global Network Signals */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.08] pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Ghost className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">1,480+</div>
              <div className="text-[11px] text-slate-400">Ghost Postings Flagged</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400 font-mono">342</div>
              <div className="text-[11px] text-slate-400">Monthly Confirmed Visas</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-cyan-300 font-mono">12,400+</div>
              <div className="text-[11px] text-slate-400">Connected Hubs</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-violet-300 font-mono">99.4%</div>
              <div className="text-[11px] text-slate-400">ATS Solver Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090d16] border border-white/[0.06] w-fit">
        <button
          onClick={() => setActiveTab('ghost_radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'ghost_radar'
              ? 'bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ghost Job Radar
        </button>
        <button
          onClick={() => setActiveTab('visa_heatmap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'visa_heatmap'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Visa Heatmap
        </button>
        <button
          onClick={() => setActiveTab('ats_health')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'ats_health'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ATS Selector Health
        </button>
      </div>

      {/* TAB 1: GHOST JOB RADAR */}
      {activeTab === 'ghost_radar' && (
        <div className="p-6 rounded-3xl bg-[#090d16] border border-red-500/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Real-Time Ghost Job Warning Radar
              </h3>
              <p className="text-xs text-slate-400">
                Identifies stale job postings with high applicant traffic and 0 interview invitations across the network.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20">
              Live Filter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ghostJobs.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.ghostScore > 75
                    ? 'bg-red-950/15 border-red-500/30'
                    : 'bg-emerald-950/15 border-emerald-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.role}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.company} • {item.atsUsed}</p>
                  </div>
                  <span
                    className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl ${
                      item.ghostScore > 75
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    Ghost Score: {item.ghostScore}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
                    <div className="text-xs font-bold text-white font-mono">{item.applicantsReported}</div>
                    <div className="text-[9px] text-slate-400 uppercase">Applicants</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
                    <div className="text-xs font-bold text-emerald-400 font-mono">{item.interviewsReported}</div>
                    <div className="text-[9px] text-slate-400 uppercase">Interviews</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04]">
                    <div className="text-xs font-bold text-amber-400 font-mono">{item.avgDaysOpen}d</div>
                    <div className="text-[9px] text-slate-400 uppercase">Days Active</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE VISA HEATMAP */}
      {activeTab === 'visa_heatmap' && (
        <div className="p-6 rounded-3xl bg-[#090d16] border border-emerald-500/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Verified Monthly Sponsorship Approvals
              </h3>
              <p className="text-xs text-slate-400">
                Companies with active visa issuance and relocation offers verified by the global network this month.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Verified Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visaHeatmap.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0e1322] border border-emerald-500/30 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.company}</h4>
                    <p className="text-xs text-slate-400 font-mono">{item.industry} • {item.location}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                    {item.tierRating}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                  <div>
                    Monthly Approvals: <span className="text-emerald-400 font-bold">{item.recentApprovalsCount}</span>
                  </div>
                  <div>
                    Avg Relocation: <span className="text-cyan-400 font-bold">{item.avgRelocationDays} days</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.targetRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-300 font-mono"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATS SELECTOR HEALTH */}
      {activeTab === 'ats_health' && (
        <div className="p-6 rounded-3xl bg-[#090d16] border border-cyan-500/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                ATS Accessibility Tree & Cloudflare Bypass Health
              </h3>
              <p className="text-xs text-slate-400">
                Continuous health checks of headless Playwright ADA trees and Direct API endpoints.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Live Probes
            </span>
          </div>

          <div className="space-y-3">
            {atsHealth.map((ats) => (
              <div
                key={ats.id}
                className="p-4 rounded-2xl bg-[#0e1322] border border-white/[0.08] flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{ats.atsName}</h4>
                  <p className="text-[10px] text-slate-400">Probe tested: {ats.lastTested}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-400 font-mono">{ats.ariaTreeHealth}%</div>
                    <div className="text-[9px] text-slate-500 uppercase">Tree Health</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono uppercase">{ats.cloudflareBypass}</div>
                    <div className="text-[9px] text-slate-500 uppercase">Bypass Status</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-300 font-mono">{ats.avgLatencyMs}ms</div>
                    <div className="text-[9px] text-slate-500 uppercase">Latency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
