import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  GitBranch,
  Search,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Code2,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Cpu,
  BarChart3,
  Terminal,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GitHubRepoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSkillsToProfile?: (skills: string[]) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface RepoAnalysisResult {
  repoName: string;
  branch: string;
  commitHash: string;
  lastAnalyzed: string;
  alignmentScore: number;
  detectedArchitecture: {
    e2eFramework: string;
    loadTesting: string;
    sastEngine: string;
    ciPipeline: string;
    agenticAi: string;
  };
  codeProofPoints: {
    domain: string;
    metric: string;
    filePath: string;
    evidence: string;
    snippet: string;
  }[];
  extractedSkills: string[];
  alignmentSummary: string;
}

const PRESET_REPOS = [
  {
    name: 'moayed/cherenkov-qa',
    desc: 'Core Agentic QA Swarm Engine with MCP Stdio and Playwright CDP ARIA Tree',
    defaultBranch: 'main'
  },
  {
    name: 'cherenkov-qa/enterprise-matrix',
    desc: 'High-Concurrency k6 Load Profiles & Sharded GitHub Actions CI Pipeline',
    defaultBranch: 'main'
  },
  {
    name: 'moayed/zero-trust-codeql',
    desc: 'Static Security Analysis Rules & OWASP Automated Triage Rulesets',
    defaultBranch: 'main'
  }
];

export const GitHubRepoSyncModal: React.FC<GitHubRepoSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncSkillsToProfile,
  onToast
}) => {
  const [repoInput, setRepoInput] = useState('moayed/cherenkov-qa');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<RepoAnalysisResult | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [hasSynced, setHasSynced] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async (repoToAnalyze?: string) => {
    const targetRepo = repoToAnalyze || repoInput;
    if (!targetRepo.trim()) {
      onToast('error', 'Repository Required', 'Please enter a GitHub repository name or URL.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setHasSynced(false);

    // Progressive UI feedback steps
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    try {
      const response = await fetch('/api/github/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: targetRepo,
          branch
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error('Failed to analyze repository codebase');
      }

      const data: RepoAnalysisResult = await response.json();
      setAnalysisResult(data);
      localStorage.setItem('cherenkov_linked_github_repo', JSON.stringify(data));
      onToast('success', 'Codebase Analyzed', `Extracted proof points from ${data.repoName}.`);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Repo analysis failed:', err);
      onToast('error', 'Analysis Error', err.message || 'Could not analyze codebase.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(id);
    onToast('success', 'Code Snippet Copied', 'Copied architectural proof point to clipboard.');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleSyncToProfile = () => {
    if (!analysisResult) return;
    if (onSyncSkillsToProfile) {
      onSyncSkillsToProfile(analysisResult.extractedSkills);
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    setHasSynced(true);
    onToast(
      'success',
      'Profile Synchronized',
      `Injected ${analysisResult.extractedSkills.length} repository proof points into Master Profile.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-surface border border-info-line rounded-panel p-6 sm:p-8 shadow-pop space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-card bg-info text-ink">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-ink tracking-tight">
                  GitHub Repository Codebase Sync
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-info-soft border border-info-line text-info-ink rounded-full">
                  AI AST ANALYZER
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Link your test engineering repository to automatically extract Playwright fixtures, k6 load profiles, and CodeQL security gates into your Master Profile.
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

        {/* Preset Repositories Quick Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-ink-muted uppercase font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-info-ink" />
            <span>Select Candidate Repository Preset:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_REPOS.map((preset) => {
              const isSelected = repoInput === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    setRepoInput(preset.name);
                    setBranch(preset.defaultBranch);
                  }}
                  className={`p-3 rounded-card border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-info-soft border-info-line text-ink ring-1 ring-info-line'
                      : 'bg-fill hover:bg-fill border-line text-ink-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-info-ink truncate">
                      {preset.name}
                    </span>
                    <GitBranch className="w-3.5 h-3.5 text-ink-muted" />
                  </div>
                  <p className="text-[10px] text-ink-muted line-clamp-2 mt-1 leading-snug">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar & Branch Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Github className="w-4 h-4 absolute left-3.5 top-3.5 text-info-ink" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. username/repository or https://github.com/..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink placeholder:text-ink-faint focus:outline-none focus:border-info-line font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-32">
              <GitBranch className="w-3.5 h-3.5 absolute left-3 top-3.5 text-ink-muted" />
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="branch"
                className="w-full pl-8 pr-3 py-2.5 text-xs bg-sunken border border-line rounded-control text-ink font-mono focus:outline-none focus:border-info-line"
              />
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing}
              className="px-5 py-2.5 text-xs font-extrabold text-ink bg-info hover:opacity-90 rounded-control transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-ink" />
                  <span>Scanning AST...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-ink" />
                  <span>Scan & Extract Proof</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scanning Step Indicators */}
        {isAnalyzing && (
          <div className="p-4 rounded-card bg-sunken border border-info-line space-y-3 animate-fade-in">
            <div className="text-xs font-mono font-bold text-info-ink flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Codebase Invariants & Test Architecture...</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { title: 'AST Parser', desc: 'Page Object Models' },
                { title: 'CI Workflows', desc: 'GitHub Actions Matrix' },
                { title: 'Security Gates', desc: 'CodeQL SARIF Scans' },
                { title: 'Load Invariants', desc: 'k6 Spike Scripts' }
              ].map((step, idx) => (
                <div
                  key={step.title}
                  className={`p-2.5 rounded-control border text-xs font-mono ${
                    analysisStep >= idx
                      ? 'bg-info-soft border-info-line text-info-ink'
                      : 'bg-fill border-line text-ink-faint'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    {analysisStep >= idx ? <CheckCircle2 className="w-3 h-3 text-positive-ink" /> : '•'}
                    <span>{step.title}</span>
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5 truncate">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Results View */}
        {analysisResult && !isAnalyzing && (
          <div className="space-y-5 animate-fade-in">
            {/* Top Score & Architecture Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-card bg-positive border border-positive-line flex items-center gap-3.5">
                <div className="p-3 rounded-control bg-positive-soft text-positive-ink border border-positive-line">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-mono font-black text-positive-ink">
                    {analysisResult.alignmentScore}% MATCH
                  </div>
                  <div className="text-[11px] text-ink-muted">Technical Codebase Fit</div>
                </div>
              </div>

              <div className="p-4 rounded-card bg-surface border border-line flex items-center gap-3.5">
                <div className="p-3 rounded-control bg-accent-soft text-accent-ink border border-accent-line">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-ink">
                    {analysisResult.detectedArchitecture.e2eFramework}
                  </div>
                  <div className="text-[11px] text-ink-muted">Verified Automation Engine</div>
                </div>
              </div>

              <div className="p-4 rounded-card bg-surface border border-line flex items-center gap-3.5">
                <div className="p-3 rounded-control bg-info-soft text-info-ink border border-info-line">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-info-ink">
                    {analysisResult.detectedArchitecture.sastEngine}
                  </div>
                  <div className="text-[11px] text-ink-muted">Static Security Scanning</div>
                </div>
              </div>
            </div>

            {/* Code Proof Points Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold text-ink-muted flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-info-ink" />
                  <span>Hard Code Proof Points Extracted:</span>
                </span>
                <span className="text-[10px] font-mono text-positive-ink">
                  {analysisResult.codeProofPoints.length} VERIFIED ARTIFACTS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {analysisResult.codeProofPoints.map((proof, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-card bg-sunken border border-line hover:border-info-line transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-info" />
                          <span>{proof.domain}</span>
                        </div>
                        <div className="text-[11px] font-mono text-positive-ink mt-0.5">
                          {proof.metric}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-fill text-ink-muted rounded border border-line truncate max-w-[130px]">
                        {proof.filePath}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      {proof.evidence}
                    </p>

                    {/* Code Snippet Box */}
                    <div className="relative group/snippet">
                      <pre className="p-2.5 rounded-control bg-sunken border border-line text-[10px] font-mono text-ink-muted overflow-x-auto">
                        {proof.snippet}
                      </pre>
                      <button
                        onClick={() => handleCopySnippet(proof.snippet, `proof-${idx}`)}
                        className="absolute right-2 top-2 p-1.5 rounded-control bg-fill-strong hover:bg-fill-strong text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Copy code proof"
                      >
                        {copiedSnippet === `proof-${idx}` ? (
                          <Check className="w-3 h-3 text-positive-ink" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Skills Chips */}
            <div className="p-4 rounded-card bg-surface border border-line space-y-2">
              <div className="text-[11px] font-mono uppercase text-ink-muted font-bold">
                Extracted Competencies from AST:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.extractedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs font-mono bg-info-soft border border-info-line text-info-ink rounded-control font-bold"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Sync Action Footer */}
            <div className="p-4 rounded-card bg-info border border-info-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-ink-muted">
                <span>Synchronize verified codebase evidence into </span>
                <span className="text-info-ink font-bold font-mono">Master Profile</span>
              </div>

              <button
                onClick={handleSyncToProfile}
                disabled={hasSynced}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-control transition-all flex items-center gap-2 ${
                  hasSynced
                    ? 'bg-positive/80 text-positive-ink border border-positive-line cursor-default'
                    : 'bg-positive hover:opacity-90 text-ink cursor-pointer'
                }`}
              >
                {hasSynced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-positive-ink" />
                    <span>Synchronized to Master Profile!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-ink" />
                    <span>1-Click Sync to Master Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
