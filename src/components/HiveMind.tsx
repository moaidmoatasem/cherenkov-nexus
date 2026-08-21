import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import type { ToastFn } from './Toast';

export interface HiveMindProps {
  onToast: ToastFn;
}

export const HiveMind: React.FC<HiveMindProps> = ({ onToast }) => {
  const [ghostJobs] = useState<GhostJobSignal[]>(INITIAL_GHOST_JOBS);
  const [visaHeatmap] = useState<VisaHeatmapItem[]>(INITIAL_VISA_HEATMAP);
  const [atsHealth] = useState<AtsHealthStatus[]>(INITIAL_ATS_HEALTH);
  const [isTelemetryOptIn, setIsTelemetryOptIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'ghost_radar' | 'visa_heatmap' | 'ats_health'>('ghost_radar');

  const flaggedCount = ghostJobs.filter((job) => job.status === 'flagged').length;
  const sponsorCount = visaHeatmap.filter((item) => item.verifiedSponsor).length;

  const handleToggleOptIn = () => {
    const next = !isTelemetryOptIn;
    setIsTelemetryOptIn(next);
    onToast(
      'info',
      next ? 'Hive-Mind Enabled' : 'Hive-Mind Disabled',
      next
        ? 'Saved as a preference. No reporting network exists in this build, so nothing is sent.'
        : 'Local offline mode enforced.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-8 rounded-panel bg-surface border border-info-line relative overflow-hidden shadow-pop">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-info-soft border border-info-line text-info-ink text-xs font-mono font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-info-ink" />
              <span>COMMUNITY HIVE-MIND RADAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Hiring Telemetry &amp; Ghost Job Radar
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              A preview of what pooled reporting would surface: stale postings, sponsorship
              activity by employer, and ATS selector health. Contributing requires a reporting
              network this build does not have yet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-card bg-fill border border-line flex items-center gap-3">
              <div>
                <div className="text-xs font-bold text-ink">Anonymous Telemetry</div>
                <div className="text-2xs text-ink-muted">Preference only — nothing is sent</div>
              </div>
              <button
                onClick={handleToggleOptIn}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isTelemetryOptIn ? 'bg-info' : 'bg-fill-strong'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-accent-contrast transition-transform absolute top-1 ${
                    isTelemetryOptIn ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Counts describe the sample below, not a network. Anything else here
            would be a number this build has no way to know. */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-critical-soft text-critical-ink border border-critical-line">
              <Ghost className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-ink font-mono tabular">{flaggedCount}</div>
              <div className="text-xs text-ink-muted">Flagged in sample</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-positive-ink font-mono tabular">{sponsorCount}</div>
              <div className="text-xs text-ink-muted">Sponsors in sample</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-info-soft text-info-ink border border-info-line">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-info-ink font-mono tabular">0</div>
              <div className="text-xs text-ink-muted">Reporting peers</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-accent-soft text-accent-ink border border-accent-line">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-accent-ink font-mono tabular">{atsHealth.length}</div>
              <div className="text-xs text-ink-muted">ATS endpoints listed</div>
            </div>
          </div>
        </div>
      </div>

      {/* The screen shows fixture data. Say so once, unmissably, above the tabs. */}
      <div
        role="note"
        data-testid="hivemind-sample-notice"
        className="p-4 rounded-card bg-caution-soft border border-caution-line flex items-start gap-3"
      >
        <AlertTriangle className="w-4 h-4 text-caution-ink shrink-0 mt-0.5" />
        <p className="text-sm text-ink-muted leading-relaxed">
          <span className="font-bold text-caution-ink">Sample data — not live telemetry.</span>{' '}
          Every company, score and timestamp below is fixture content shipped with the app.
          Employer names are fictional. Nothing here reflects a real posting, a real sponsorship
          decision, or a real hiring pattern, and it must not be used to judge an employer.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-card bg-sunken border border-line w-fit">
        <button
          onClick={() => setActiveTab('ghost_radar')}
          className={`px-4 py-2 rounded-control text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'ghost_radar'
              ? 'bg-critical text-ink-inverse font-black'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Ghost Job Radar
        </button>
        <button
          onClick={() => setActiveTab('visa_heatmap')}
          className={`px-4 py-2 rounded-control text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'visa_heatmap'
              ? 'bg-positive text-ink-inverse font-black'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Visa Heatmap
        </button>
        <button
          onClick={() => setActiveTab('ats_health')}
          className={`px-4 py-2 rounded-control text-xs font-bold font-mono transition-all cursor-pointer ${
            activeTab === 'ats_health'
              ? 'bg-info text-ink font-black'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          ATS Selector Health
        </button>
      </div>

      {/* TAB 1: GHOST JOB RADAR */}
      {activeTab === 'ghost_radar' && (
        <div className="p-6 rounded-panel bg-sunken border border-critical-line space-y-4 shadow-pop">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase font-mono">
                Ghost Job Warning Radar
              </h3>
              <p className="text-sm text-ink-muted">
                The pattern the radar looks for: a posting open for months, heavy applicant
                traffic, almost no interviews.
              </p>
            </div>
            <span className="text-2xs font-mono px-2.5 py-1 rounded bg-critical-soft text-critical-ink border border-critical-line">
              Sample Filter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ghostJobs.map((item) => (
              <div
                key={item.id}
                data-testid="ghost-job-card"
                className={`p-5 rounded-card border transition-all ${
                  item.ghostScore > 75
                    ? 'bg-critical-soft border-critical-line'
                    : 'bg-positive-soft border-positive-line'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{item.role}</h4>
                    <p className="text-sm text-ink-muted font-mono mt-0.5">{item.company} • {item.atsUsed}</p>
                  </div>
                  <span
                    className={`text-xs font-mono font-black px-2.5 py-1 rounded-control ${
                      item.ghostScore > 75
                        ? 'bg-critical-soft text-critical-ink border border-critical-line'
                        : 'bg-positive-soft text-positive-ink border border-positive-line'
                    }`}
                  >
                    Ghost Score: {item.ghostScore}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded-control bg-sunken border border-line">
                    <div className="text-xs font-bold text-ink font-mono">{item.applicantsReported}</div>
                    <div className="text-2xs text-ink-muted uppercase">Applicants</div>
                  </div>
                  <div className="p-2 rounded-control bg-sunken border border-line">
                    <div className="text-xs font-bold text-positive-ink font-mono">{item.interviewsReported}</div>
                    <div className="text-2xs text-ink-muted uppercase">Interviews</div>
                  </div>
                  <div className="p-2 rounded-control bg-sunken border border-line">
                    <div className="text-xs font-bold text-caution-ink font-mono">{item.avgDaysOpen}d</div>
                    <div className="text-2xs text-ink-muted uppercase">Days Active</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VISA HEATMAP */}
      {activeTab === 'visa_heatmap' && (
        <div className="p-6 rounded-panel bg-sunken border border-line space-y-4 shadow-pop">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase font-mono">
                Sponsorship Approval Heatmap
              </h3>
              <p className="text-sm text-ink-muted">
                Illustrative approval volumes and relocation timelines for the fictional
                employers below. Nobody has verified these — the Sponsorship Oracle is where
                a real answer comes from.
              </p>
            </div>
            <span className="text-2xs font-mono px-2.5 py-1 rounded bg-caution-soft text-caution-ink border border-caution-line shrink-0">
              Sample data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visaHeatmap.map((item) => (
              <div
                key={item.id}
                data-testid="visa-heatmap-card"
                className="p-5 rounded-card bg-surface border border-line space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{item.company}</h4>
                    <p className="text-sm text-ink-muted font-mono">{item.industry} • {item.location}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-control bg-fill text-ink-muted border border-line text-xs font-mono font-bold">
                    {item.tierRating}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-ink-muted">
                  <div>
                    Monthly Approvals: <span className="text-ink font-bold">{item.recentApprovalsCount}</span>
                  </div>
                  <div>
                    Avg Relocation: <span className="text-ink font-bold">{item.avgRelocationDays} days</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.targetRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-chip bg-fill text-2xs text-ink-muted font-mono"
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
        <div className="p-6 rounded-panel bg-sunken border border-info-line space-y-4 shadow-pop">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase font-mono">
                ATS Connector Health
              </h3>
              <p className="text-sm text-ink-muted">
                How each published board API and accessibility-tree reader has been behaving.
                No probe runs from this workspace — these are fixture readings like the rest
                of the screen.
              </p>
            </div>
            <span className="text-2xs font-mono px-2.5 py-1 rounded bg-caution-soft text-caution-ink border border-caution-line shrink-0">
              Sample data
            </span>
          </div>

          <div className="space-y-3">
            {atsHealth.map((ats) => (
              <div
                key={ats.id}
                data-testid="ats-health-row"
                className="p-4 rounded-card bg-surface border border-line flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink font-mono">{ats.atsName}</h4>
                  <p className="text-2xs text-ink-muted">Sample reading, {ats.lastTested}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-bold text-ink font-mono">{ats.ariaTreeHealth}%</div>
                    <div className="text-2xs text-ink-faint uppercase">Tree Health</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-ink font-mono uppercase">{ats.fetchStatus}</div>
                    <div className="text-2xs text-ink-faint uppercase">Fetch Status</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-ink-muted font-mono">{ats.avgLatencyMs}ms</div>
                    <div className="text-2xs text-ink-faint uppercase">Latency</div>
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
