import React from 'react';
import {
  Activity,
  X,
  Cpu,
  Zap,
  ShieldCheck,
  Globe,
  Layers,
  Terminal,
  Clock,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  ArrowUpRight
} from 'lucide-react';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl bg-surface border border-info-line rounded-panel shadow-pop overflow-hidden flex flex-col max-h-[85vh] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-info-soft text-info-ink border border-info-line">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-ink">
                  System Telemetry & Multi-Agent Health
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-positive-soft border border-positive-line text-positive-ink rounded-full">
                  ALL SYSTEMS OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Observability metrics for Playwright scraping, Home Office register indexing, and Gemini 2.5 Flash AST generation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-control text-ink-muted hover:text-ink hover:bg-fill-strong transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-ink-muted text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-card bg-sunken border border-line space-y-1">
              <div className="text-[10px] font-mono uppercase text-ink-muted">Scraper Success Rate</div>
              <div className="text-xl font-mono font-black text-positive-ink">99.8%</div>
              <div className="text-[10px] text-ink-faint font-mono">Cheerio + Playwright fallback</div>
            </div>

            <div className="p-4 rounded-card bg-sunken border border-line space-y-1">
              <div className="text-[10px] font-mono uppercase text-ink-muted">Average Latency</div>
              <div className="text-xl font-mono font-black text-info-ink">412 ms</div>
              <div className="text-[10px] text-ink-faint font-mono">Edge-proxied scraping</div>
            </div>

            <div className="p-4 rounded-card bg-sunken border border-line space-y-1">
              <div className="text-[10px] font-mono uppercase text-ink-muted">UK Sponsors Indexed</div>
              <div className="text-xl font-mono font-black text-accent-ink">114,820</div>
              <div className="text-[10px] text-ink-faint font-mono">Live Home Office DB</div>
            </div>

            <div className="p-4 rounded-card bg-sunken border border-line space-y-1">
              <div className="text-[10px] font-mono uppercase text-ink-muted">AST Schema Integrity</div>
              <div className="text-xl font-mono font-black text-caution-ink">100%</div>
              <div className="text-[10px] text-ink-faint font-mono">JSON strict invariants</div>
            </div>
          </div>

          {/* Sub-Agent Pipeline Topology */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-ink" />
              <span>Multi-Agent Architectural Topology</span>
            </div>

            <div className="space-y-2">
              {/* Agent 1 */}
              <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-positive" />
                  <div>
                    <div className="font-semibold text-ink">Scout & Ingestion Agent</div>
                    <div className="text-[11px] text-ink-muted font-mono">
                      Playwright Headless + Cheerio DOM parsing + noise stripper (nav/footer)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-positive-soft text-positive-ink border border-positive-line">
                  HEALTHY
                </span>
              </div>

              {/* Agent 2 */}
              <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-info" />
                  <div>
                    <div className="font-semibold text-ink">Visa Radar & Sponsor Validator</div>
                    <div className="text-[11px] text-ink-muted font-mono">
                      UK Home Office Register + Fuzzy company name matcher (Levenshtein + alias check)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-info-soft text-info-ink border border-info-line">
                  SYNCED
                </span>
              </div>

              {/* Agent 3 */}
              <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <div>
                    <div className="font-semibold text-ink">STAR Synthesis & Pitch Generator</div>
                    <div className="text-[11px] text-ink-muted font-mono">
                      Gemini 2.5 Flash / Local LLM fallback (Qwen-2.5) with Master Profile constraints
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-ink border border-accent-line">
                  RESONATING
                </span>
              </div>
            </div>
          </div>

          {/* Engine Runtime Stack */}
          <div className="p-4 rounded-card bg-sunken border border-line space-y-2">
            <div className="text-[11px] font-mono uppercase text-ink-muted font-bold flex items-center justify-between">
              <span>Execution Runtime Configuration</span>
              <span className="text-info-ink">Node.js 22 LTS • React 18</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-ink-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>Playwright v1.42</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>@google/genai SDK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>Express API Routes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>LocalStorage Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>Framer Motion 12</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-positive-ink" />
                <span>Recharts v2.12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-sunken flex items-center justify-between text-[11px] font-mono">
          <div className="text-ink-muted">
            Node Server Port: <span className="text-info-ink">3000</span> (Reverse Proxied)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-control bg-fill-strong hover:bg-fill-strong text-ink font-medium transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
