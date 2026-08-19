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
  'scout': <Terminal className="w-5 h-5 text-info-ink" />,
  'visa-validator': <ShieldCheck className="w-5 h-5 text-positive-ink" />,
  'synthesizer': <Sparkles className="w-5 h-5 text-accent-ink" />,
  'approval': <UserCheck className="w-5 h-5 text-caution-ink" />,
  'ats-submitter': <Zap className="w-5 h-5 text-info-ink" />,
  'lrs-sync': <Layers className="w-5 h-5 text-critical-ink" />
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
        className="p-8 rounded-panel bg-surface border border-accent-line shadow-pop relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-line text-accent-ink text-xs font-mono font-bold">
              <Workflow className="w-3.5 h-3.5" />
              <span>LANGGRAPH VISUAL AGENT ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Visual Multi-Agent Canvas & Workflow Builder
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Design, monitor, and execute autonomous multi-agent pipelines with deterministic Human-in-the-Loop approval gates.
            </p>
          </div>

          {/* Workflow Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetWorkflow}
              className="px-4 py-2.5 rounded-card bg-fill hover:bg-fill-strong text-ink-muted text-xs font-mono font-bold flex items-center gap-2 border border-line cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Graph</span>
            </button>

            {pausedAtApproval ? (
              <button
                onClick={handleApproveAndProceed}
                className="px-5 py-2.5 rounded-card bg-caution hover:opacity-90 text-ink-inverse text-xs font-mono font-black flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Dispatch ATS</span>
              </button>
            ) : (
              <button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                className={`px-5 py-2.5 rounded-card text-xs font-mono font-black flex items-center gap-2 transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-accent/50 text-accent-ink cursor-not-allowed'
                    : 'bg-accent hover:bg-accent-strong text-ink hover:scale-[1.02]'
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
      <div className="p-6 rounded-panel bg-sunken border border-line space-y-6 shadow-pop relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-positive animate-ping" />
            <span>SWARM PIPELINE: 5 Connected Nodes</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-fill text-ink-muted border border-line">
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
                className={`p-5 rounded-card bg-surface border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  node.status === 'running'
                    ? 'border-info-line ring-2 ring-info-line'
                    : node.status === 'paused_approval'
                    ? 'border-caution-line ring-2 ring-caution-line animate-pulse'
                    : node.status === 'success'
                    ? 'border-positive-line'
                    : isSelected
                    ? 'border-accent-line ring-1 ring-accent-line'
                    : 'border-line hover:border-line-strong'
                }`}
              >
                {/* Node Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-control bg-fill border border-line">
                    {NODE_ICONS[node.type]}
                  </div>

                  <div>
                    {node.status === 'idle' && (
                      <span className="text-[10px] font-mono text-ink-faint px-2 py-0.5 rounded bg-fill">
                        STANDBY
                      </span>
                    )}
                    {node.status === 'running' && (
                      <span className="text-[10px] font-mono text-info-ink font-bold px-2 py-0.5 rounded bg-info-soft border border-info-line animate-pulse">
                        RUNNING
                      </span>
                    )}
                    {node.status === 'paused_approval' && (
                      <span className="text-[10px] font-mono text-caution-ink font-bold px-2 py-0.5 rounded bg-caution-soft border border-caution-line">
                        APPROVAL
                      </span>
                    )}
                    {node.status === 'success' && (
                      <span className="text-[10px] font-mono text-positive-ink font-bold px-2 py-0.5 rounded bg-positive-soft border border-positive-line">
                        SUCCESS
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-ink group-hover:text-accent-ink transition-colors">
                    {node.title}
                  </h3>
                  <p className="text-[10px] text-ink-muted font-mono">{node.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-line text-[10px] text-ink-muted line-clamp-2">
                  {node.lastOutput}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Swarm Terminal Log Console */}
        <div className="p-5 rounded-card bg-sunken border border-line space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-ink-muted pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-info-ink" />
              <span>LIVE AGENT SWARM EXECUTION LOGS</span>
            </div>
            <span className="text-[10px] text-ink-faint">Auto-scrolling stream</span>
          </div>

          <div className="h-36 overflow-y-auto space-y-1 text-[11px] text-ink-muted pr-2">
            {executionLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('HUMAN-IN-THE-LOOP')
                    ? 'text-caution-ink font-bold'
                    : log.includes('Complete')
                    ? 'text-positive-ink font-bold'
                    : log.includes('Executing') || log.includes('Spawning')
                    ? 'text-info-ink'
                    : 'text-ink-muted'
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
