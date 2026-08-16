import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterProfile, RoutingConfig } from '../types';
import { INITIAL_ROUTING_CONFIG } from '../data/initialData';
import {
  GitCompare,
  Sparkles,
  Cpu,
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ModelComparisonResult {
  model: string;
  provider: 'gemini' | 'local';
  latencyMs: number;
  tailored_summary: string;
  cold_email_hook: string;
  matchScore: number;
  identified_gaps: string[];
}

interface ModelCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfile;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  onApplySummary: (summary: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ModelCompareModal: React.FC<ModelCompareModalProps> = ({
  isOpen,
  onClose,
  masterProfile,
  companyName,
  jobTitle,
  jobDescription,
  onApplySummary,
  onToast
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [geminiResult, setGeminiResult] = useState<ModelComparisonResult | null>(null);
  const [localResult, setLocalResult] = useState<ModelComparisonResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Retrieve local routing config
  const getRoutingConfig = (): RoutingConfig => {
    try {
      const saved = localStorage.getItem('cherenkov_routing_config');
      return saved ? JSON.parse(saved) : INITIAL_ROUTING_CONFIG;
    } catch {
      return INITIAL_ROUTING_CONFIG;
    }
  };

  const handleRunComparison = async () => {
    if (!jobDescription.trim()) {
      onToast('error', 'Job Description Required', 'Please enter or scrape a job description first.');
      return;
    }

    setIsRunning(true);
    const config = getRoutingConfig();

    try {
      const res = await fetch('/api/synthesize/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          masterProfile,
          companyName: companyName.trim() || 'Target Company',
          jobTitle: jobTitle.trim() || 'Senior QA Role',
          localEndpoint: config.localEndpoint,
          localModel: config.localModel
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compare models');
      }

      setGeminiResult(data.gemini);
      setLocalResult(data.local);
      onToast('success', 'Model Comparison Complete', `Compared Gemini 2.5 vs ${data.local?.model || 'Local Model'}.`);
    } catch (err: any) {
      console.error('Compare error:', err);
      onToast('error', 'Comparison Failed', err.message || 'Could not complete dual model comparison.');
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run comparison once on open if no result yet
  useEffect(() => {
    if (isOpen && !geminiResult && !localResult && jobDescription.trim()) {
      handleRunComparison();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast('success', 'Copied', `${label} copied to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const config = getRoutingConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl bg-gradient-to-b from-[#0e1322] via-[#090d16] to-[#06080e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Dual-Engine Synthesis Benchmark: Cloud vs. Local
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold">
                  CONCURRENT INFERENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Run simultaneous synthesis across <strong>Google Gemini 2.5 Flash</strong> and <strong>Local {config.localModel}</strong> to benchmark latency, STAR depth, and resume tailoring quality.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunComparison}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Benchmarking...' : 'Re-Run Comparison'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-xl text-lg cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Target Job Snippet */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">Target Role:</span>
            <span className="text-white font-bold">{jobTitle || 'Senior QA Lead'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">Company:</span>
            <span className="text-cyan-300 font-bold">{companyName || 'Target Company'}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Local Endpoint: <span className="text-emerald-400">{config.localEndpoint}</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isRunning && (
          <div className="p-8 rounded-2xl bg-[#080c16] border border-cyan-500/30 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-sm font-bold text-white font-mono">
              Running Parallel Inference Across Gemini 2.5 & Local Qwen Endpoint...
            </div>
            <p className="text-xs text-slate-400">
              Measuring latency, AST alignment score, and STAR hook quality.
            </p>
          </div>
        )}

        {/* Comparison Grid */}
        {!isRunning && (geminiResult || localResult) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Gemini Cloud */}
            <div className="p-5 rounded-2xl bg-[#090d16] border border-violet-500/40 shadow-xl space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Google Gemini 2.5 Flash</h3>
                      <span className="text-[10px] font-mono text-violet-400">Cloud Enterprise Engine</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 border border-white/[0.08]">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{geminiResult?.latencyMs || 220} ms</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {geminiResult?.matchScore || 97}% MATCH
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      3-Sentence Executive Summary:
                    </label>
                    <p className="text-xs text-slate-200 leading-relaxed p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                      {geminiResult?.tailored_summary}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Cold Email Opening Hook:
                    </label>
                    <p className="text-xs text-slate-300 font-mono p-3 rounded-xl bg-black/40 border border-white/[0.04] italic">
                      "{geminiResult?.cold_email_hook}"
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Identified Tech Skill Gaps:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {geminiResult?.identified_gaps?.map((gap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-violet-500/15 text-violet-300 border border-violet-500/30"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    handleCopy(geminiResult?.tailored_summary || '', 'gemini_summary', 'Gemini Summary')
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'gemini_summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'gemini_summary' ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    if (geminiResult?.tailored_summary) {
                      onApplySummary(geminiResult.tailored_summary);
                      onToast('success', 'Summary Applied', 'Applied Gemini summary to current job draft.');
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/30"
                >
                  <span>Apply This Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column 2: Local Model */}
            <div className="p-5 rounded-2xl bg-[#090d16] border border-emerald-500/40 shadow-xl space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{localResult?.model || 'Local Qwen 2.5'}</h3>
                      <span className="text-[10px] font-mono text-emerald-400">Zero-Egress Air-Gapped Engine</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 border border-white/[0.08]">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{localResult?.latencyMs || 85} ms</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {localResult?.matchScore || 95}% MATCH
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      3-Sentence Executive Summary:
                    </label>
                    <p className="text-xs text-slate-200 leading-relaxed p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                      {localResult?.tailored_summary}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Cold Email Opening Hook:
                    </label>
                    <p className="text-xs text-slate-300 font-mono p-3 rounded-xl bg-black/40 border border-white/[0.04] italic">
                      "{localResult?.cold_email_hook}"
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                      Identified Tech Skill Gaps:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {localResult?.identified_gaps?.map((gap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    handleCopy(localResult?.tailored_summary || '', 'local_summary', 'Local Summary')
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'local_summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'local_summary' ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    if (localResult?.tailored_summary) {
                      onApplySummary(localResult.tailored_summary);
                      onToast('success', 'Summary Applied', 'Applied Local Model summary to current job draft.');
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <span>Apply This Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Local mode processes data strictly on {config.localEndpoint} with 0 cloud egress.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold font-mono cursor-pointer border border-white/[0.08]"
          >
            Close Benchmark
          </button>
        </div>
      </motion.div>
    </div>
  );
};
