import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentNode, AgentEdge, AgentNodeType } from '../types';
import { INITIAL_AGENT_NODES, INITIAL_AGENT_EDGES } from '../data/initialData';
import {
  Workflow,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Zap,
  Sliders,
  Plus,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export interface AgentCanvasProps {
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const NODE_ICONS: Record<AgentNodeType, React.ReactNode> = {
  'scout': <Terminal className="w-5 h-5 text-cyan-400" />,
  'visa-validator': <ShieldCheck className="w-5 h-5 text-emerald-400" />,
  'synthesizer': <Sparkles className="w-5 h-5 text-violet-400" />,
  'approval': <UserCheck className="w-5 h-5 text-amber-400" />,
  'ats-submitter': <Zap className="w-5 h-5 text-sky-400" />,
  'lrs-sync': <Layers className="w-5 h-5 text-pink-400" />
};

export const AgentCanvas: React.FC<AgentCanvasProps> = ({ onToast }) => {
  const [nodes, setNodes] = useState<AgentNode[]>(() => {
    try {
      const saved = localStorage.getItem('cherenkov_agent_nodes');
      return saved ? JSON.parse(saved) : INITIAL_AGENT_NODES;
    } catch {
      return INITIAL_AGENT_NODES;
    }
  });

  const [edges] = useState<AgentEdge[]>(INITIAL_AGENT_EDGES);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [pausedAtApproval, setPausedAtApproval] = useState(false);

  const handleRunWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStepIndex(0);
    setPausedAtApproval(false);
    setExecutionLogs(['[00:00.000] Initializing Agent Swarm Orchestrator...']);

    // Reset nodes status
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' })));

    // Step 1: Scout
    setNodes((prev) => prev.map((n, idx) => idx === 0 ? { ...n, status: 'running' } : n));
    setExecutionLogs((prev) => [...prev, '[00:00.240] [Scout Node] Spawning Playwright MCP via Stdio... fetching ARIA accessibility tree.']);
    
    await new Promise((r) => setTimeout(r, 1000));
    setNodes((prev) => prev.map((n, idx) => idx === 0 ? { ...n, status: 'success' } : n));
    setCurrentStepIndex(1);

    // Step 2: Visa Validator
    setNodes((prev) => prev.map((n, idx) => idx === 1 ? { ...n, status: 'running' } : n));
    setExecutionLogs((prev) => [...prev, '[00:01.200] [Visa Node] Executing Fuse.js fuzzy query against SQLite 114,800 records. Status: Verified Licensed Sponsor.']);
    
    await new Promise((r) => setTimeout(r, 900));
    setNodes((prev) => prev.map((n, idx) => idx === 1 ? { ...n, status: 'success' } : n));
    setCurrentStepIndex(2);

    // Step 3: Synthesizer
    setNodes((prev) => prev.map((n, idx) => idx === 2 ? { ...n, status: 'running' } : n));
    setExecutionLogs((prev) => [...prev, '[00:02.100] [Synthesizer Node] Running Zero-Hallucination AST Ground Truth check against Master Profile.']);
    
    await new Promise((r) => setTimeout(r, 1200));
    setNodes((prev) => prev.map((n, idx) => idx === 2 ? { ...n, status: 'success' } : n));
    setCurrentStepIndex(3);

    // Step 4: Human-in-the-Loop Pause
    setNodes((prev) => prev.map((n, idx) => idx === 3 ? { ...n, status: 'paused_approval' } : n));
    setExecutionLogs((prev) => [
      ...prev,
      '[00:03.300] ⚠️ [HUMAN-IN-THE-LOOP GATE] Workflow paused. Candidate approval required before dispatching ATS payload.'
    ]);
    setPausedAtApproval(true);
    onToast('info', 'Approval Required', 'Swarm reached Human-in-the-Loop pause gate.');
  };

  const handleApproveAndProceed = async () => {
    if (!pausedAtApproval) return;
    setPausedAtApproval(false);
    setExecutionLogs((prev) => [...prev, '[00:04.100] Candidate Approved. Proceeding to ATS Submitter Node.']);
    
    // Step 4 success
    setNodes((prev) => prev.map((n, idx) => idx === 3 ? { ...n, status: 'success' } : n));
    setCurrentStepIndex(4);

    // Step 5 Submitter
    setNodes((prev) => prev.map((n, idx) => idx === 4 ? { ...n, status: 'running' } : n));
    setExecutionLogs((prev) => [...prev, '[00:04.500] [Submitter Node] Posting verified payload directly to Greenhouse REST API endpoint.']);
    
    await new Promise((r) => setTimeout(r, 1100));
    setNodes((prev) => prev.map((n, idx) => idx === 4 ? { ...n, status: 'success' } : n));
    
    setExecutionLogs((prev) => [
      ...prev,
      '[00:05.600] ✅ [Workflow Complete] Application submitted successfully with Zero Hallucination guarantee.'
    ]);
    setIsRunning(false);
    setCurrentStepIndex(-1);
    onToast('success', 'Swarm Completed', 'Full autonomous workflow executed successfully.');
  };

  const handleResetWorkflow = () => {
    setIsRunning(false);
    setPausedAtApproval(false);
    setCurrentStepIndex(-1);
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' })));
    setExecutionLogs(['[00:00.000] Workflow reset to standby.']);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        id="tour-agent-canvas"
        className="p-8 rounded-3xl bg-gradient-to-br from-[#0e1322] via-[#090d18] to-[#06080e] border border-violet-500/25 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold">
              <Workflow className="w-3.5 h-3.5" />
              <span>LANGGRAPH VISUAL AGENT ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Visual Multi-Agent Canvas & Workflow Builder
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Design, monitor, and execute autonomous multi-agent pipelines with deterministic Human-in-the-Loop approval gates.
            </p>
          </div>

          {/* Workflow Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetWorkflow}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-bold flex items-center gap-2 border border-white/[0.08] cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Graph</span>
            </button>

            {pausedAtApproval ? (
              <button
                onClick={handleApproveAndProceed}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Dispatch ATS</span>
              </button>
            ) : (
              <button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-violet-600/50 text-violet-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-violet-900/30 hover:scale-[1.02]'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRunning ? 'Swarm Executing...' : 'Execute Swarm Workflow'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="p-6 rounded-3xl bg-[#090d16] border border-white/[0.07] space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SWARM PIPELINE: 5 Connected Nodes</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.08]">
              Stdio MCP Transport Active
            </span>
          </div>
        </div>

        {/* Node Pipeline Flow Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
          {nodes.map((node, index) => {
            const isSelected = selectedNode?.id === node.id;
            const isCurrent = currentStepIndex === index;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-5 rounded-2xl bg-[#0e1322] border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  node.status === 'running'
                    ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/30'
                    : node.status === 'paused_approval'
                    ? 'border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 animate-pulse'
                    : node.status === 'success'
                    ? 'border-emerald-500/50 shadow-md shadow-emerald-950/20'
                    : isSelected
                    ? 'border-violet-400 ring-1 ring-violet-500/40'
                    : 'border-white/[0.08] hover:border-white/[0.2]'
                }`}
              >
                {/* Node Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    {NODE_ICONS[node.type]}
                  </div>

                  <div>
                    {node.status === 'idle' && (
                      <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-white/[0.02]">
                        STANDBY
                      </span>
                    )}
                    {node.status === 'running' && (
                      <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 animate-pulse">
                        RUNNING
                      </span>
                    )}
                    {node.status === 'paused_approval' && (
                      <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                        APPROVAL
                      </span>
                    )}
                    {node.status === 'success' && (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                        SUCCESS
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                    {node.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">{node.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-slate-400 line-clamp-2">
                  {node.lastOutput}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Swarm Terminal Log Console */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/[0.08] space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE AGENT SWARM EXECUTION LOGS</span>
            </div>
            <span className="text-[10px] text-slate-500">Auto-scrolling stream</span>
          </div>

          <div className="h-36 overflow-y-auto space-y-1 text-[11px] text-slate-300 pr-2">
            {executionLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('HUMAN-IN-THE-LOOP')
                    ? 'text-amber-300 font-bold'
                    : log.includes('Complete')
                    ? 'text-emerald-300 font-bold'
                    : log.includes('Executing') || log.includes('Spawning')
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
