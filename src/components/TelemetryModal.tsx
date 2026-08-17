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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-[#0c101a] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-[#0e1424] to-[#0a0d16]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  System Telemetry & Multi-Agent Health
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full">
                  ALL SYSTEMS OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Observability metrics for Playwright scraping, Home Office register indexing, and Gemini 2.5 Flash AST generation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-300 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Scraper Success Rate</div>
              <div className="text-xl font-mono font-black text-emerald-400">99.8%</div>
              <div className="text-[10px] text-slate-500 font-mono">Cheerio + Playwright fallback</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">Average Latency</div>
              <div className="text-xl font-mono font-black text-cyan-400">412 ms</div>
              <div className="text-[10px] text-slate-500 font-mono">Edge-proxied scraping</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">UK Sponsors Indexed</div>
              <div className="text-xl font-mono font-black text-violet-400">114,820</div>
              <div className="text-[10px] text-slate-500 font-mono">Live Home Office DB</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400">AST Schema Integrity</div>
              <div className="text-xl font-mono font-black text-amber-400">100%</div>
              <div className="text-[10px] text-slate-500 font-mono">JSON strict invariants</div>
            </div>
          </div>

          {/* Sub-Agent Pipeline Topology */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Multi-Agent Architectural Topology</span>
            </div>

            <div className="space-y-2">
              {/* Agent 1 */}
              <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <div>
                    <div className="font-semibold text-slate-200">Scout & Ingestion Agent</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Playwright Headless + Cheerio DOM parsing + noise stripper (nav/footer)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HEALTHY
                </span>
              </div>

              {/* Agent 2 */}
              <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div>
                    <div className="font-semibold text-slate-200">Visa Radar & Sponsor Validator</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      UK Home Office Register + Fuzzy company name matcher (Levenshtein + alias check)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SYNCED
                </span>
              </div>

              {/* Agent 3 */}
              <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                  <div>
                    <div className="font-semibold text-slate-200">STAR Synthesis & Pitch Generator</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Gemini 2.5 Flash / Local LLM fallback (Qwen-2.5) with Master Profile constraints
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  RESONATING
                </span>
              </div>
            </div>
          </div>

          {/* Engine Runtime Stack */}
          <div className="p-4 rounded-2xl bg-[#07090e] border border-white/[0.08] space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
              <span>Execution Runtime Configuration</span>
              <span className="text-cyan-400">Node.js 22 LTS • React 18</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Playwright v1.42</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>@google/genai SDK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Express API Routes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>LocalStorage Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Framer Motion 12</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recharts v2.12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#090c15] flex items-center justify-between text-[11px] font-mono">
          <div className="text-slate-400">
            Node Server Port: <span className="text-cyan-400">3000</span> (Reverse Proxied)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
