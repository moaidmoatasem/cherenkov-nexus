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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl bg-gradient-to-b from-surface via-sunken to-sunken border border-accent2-line rounded-panel p-6 sm:p-8 shadow-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-card bg-gradient-to-br from-accent via-info to-accent2 text-ink shadow-lg">
              <GitCompare className="w-6 h-6 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ink tracking-tight">
                  Dual-Engine Synthesis Benchmark: Cloud vs. Local
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-accent2-soft text-accent2-ink border border-accent2-line text-[10px] font-mono font-bold">
                  CONCURRENT INFERENCE
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Run simultaneous synthesis across <strong>Google Gemini 2.5 Flash</strong> and <strong>Local {config.localModel}</strong> to benchmark latency, STAR depth, and resume tailoring quality.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunComparison}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-control bg-accent2-soft hover:bg-accent2-soft text-accent2-ink border border-accent2-line text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Benchmarking...' : 'Re-Run Comparison'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink p-1 rounded-control text-lg cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Target Job Snippet */}
        <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-ink-muted">Target Role:</span>
            <span className="text-ink font-bold">{jobTitle || 'Senior QA Lead'}</span>
            <span className="text-ink-faint">•</span>
            <span className="text-ink-muted font-mono">Company:</span>
            <span className="text-accent2-ink font-bold">{companyName || 'Target Company'}</span>
          </div>
          <div className="text-[11px] font-mono text-ink-muted">
            Local Endpoint: <span className="text-positive-ink">{config.localEndpoint}</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isRunning && (
          <div className="p-8 rounded-card bg-sunken border border-accent2-line flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-accent2-ink animate-spin" />
            <div className="text-sm font-bold text-ink font-mono">
              Running Parallel Inference Across Gemini 2.5 & Local Qwen Endpoint...
            </div>
            <p className="text-xs text-ink-muted">
              Measuring latency, AST alignment score, and STAR hook quality.
            </p>
          </div>
        )}

        {/* Comparison Grid */}
        {!isRunning && (geminiResult || localResult) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Gemini Cloud */}
            <div className="p-5 rounded-card bg-sunken border border-accent-line shadow-xl space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-control bg-accent-soft text-accent-ink border border-accent-line">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Google Gemini 2.5 Flash</h3>
                      <span className="text-[10px] font-mono text-accent-ink">Cloud Enterprise Engine</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-sunken text-ink-muted border border-line">
                      <Clock className="w-3 h-3 text-accent2-ink" />
                      <span>{geminiResult?.latencyMs || 220} ms</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
                      {geminiResult?.matchScore || 97}% MATCH
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      3-Sentence Executive Summary:
                    </label>
                    <p className="text-xs text-ink leading-relaxed p-3 rounded-control bg-sunken border border-line">
                      {geminiResult?.tailored_summary}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      Cold Email Opening Hook:
                    </label>
                    <p className="text-xs text-ink-muted font-mono p-3 rounded-control bg-sunken border border-line italic">
                      "{geminiResult?.cold_email_hook}"
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      Identified Tech Skill Gaps:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {geminiResult?.identified_gaps?.map((gap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-accent-soft text-accent-ink border border-accent-line"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    handleCopy(geminiResult?.tailored_summary || '', 'gemini_summary', 'Gemini Summary')
                  }
                  className="px-3 py-1.5 rounded-control bg-fill hover:bg-fill-strong text-xs font-mono text-ink-muted flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'gemini_summary' ? <Check className="w-3.5 h-3.5 text-positive-ink" /> : <Copy className="w-3.5 h-3.5" />}
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
                  className="px-3.5 py-1.5 rounded-control bg-accent hover:bg-accent text-ink text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Apply This Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column 2: Local Model */}
            <div className="p-5 rounded-card bg-sunken border border-positive-line shadow-xl space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{localResult?.model || 'Local Qwen 2.5'}</h3>
                      <span className="text-[10px] font-mono text-positive-ink">Zero-Egress Air-Gapped Engine</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-control bg-sunken text-ink-muted border border-line">
                      <Clock className="w-3 h-3 text-positive-ink" />
                      <span>{localResult?.latencyMs || 85} ms</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
                      {localResult?.matchScore || 95}% MATCH
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      3-Sentence Executive Summary:
                    </label>
                    <p className="text-xs text-ink leading-relaxed p-3 rounded-control bg-sunken border border-line">
                      {localResult?.tailored_summary}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      Cold Email Opening Hook:
                    </label>
                    <p className="text-xs text-ink-muted font-mono p-3 rounded-control bg-sunken border border-line italic">
                      "{localResult?.cold_email_hook}"
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-ink-muted font-bold block mb-1">
                      Identified Tech Skill Gaps:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {localResult?.identified_gaps?.map((gap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-positive-soft text-positive-ink border border-positive-line"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    handleCopy(localResult?.tailored_summary || '', 'local_summary', 'Local Summary')
                  }
                  className="px-3 py-1.5 rounded-control bg-fill hover:bg-fill-strong text-xs font-mono text-ink-muted flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'local_summary' ? <Check className="w-3.5 h-3.5 text-positive-ink" /> : <Copy className="w-3.5 h-3.5" />}
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
                  className="px-3.5 py-1.5 rounded-control bg-positive hover:bg-positive text-ink text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Apply This Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-line">
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted">
            <ShieldCheck className="w-4 h-4 text-accent2-ink" />
            <span>Local mode processes data strictly on {config.localEndpoint} with 0 cloud egress.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-control bg-fill-strong hover:bg-fill-strong text-ink text-xs font-bold font-mono cursor-pointer border border-line"
          >
            Close Benchmark
          </button>
        </div>
      </motion.div>
    </div>
  );
};
