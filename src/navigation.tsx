import React from 'react';
import { Cpu, GraduationCap, Kanban, Layers, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { TabId } from './types';
import { Tone } from './components/ui';

export interface WorkspaceDef {
  id: TabId;
  /** Full name. Also the accessible name the E2E suite navigates by. */
  name: string;
  /** Compact name for the mobile tab strip. */
  shortName: string;
  /** One line describing what the workspace does. */
  subtitle: string;
  icon: React.ReactNode;
  tone: Tone;
  /** Which group the workspace belongs to in the sidebar. */
  group: 'core' | 'platform';
}

/**
 * The one place workspaces are declared. The sidebar, the mobile tab strip and
 * the command palette all read from here, so a new module shows up everywhere
 * at once and can never drift between surfaces.
 */
export const WORKSPACES: WorkspaceDef[] = [
  {
    id: 'synthesizer',
    name: 'Job Synthesizer',
    shortName: 'Solver',
    subtitle: 'ATS match & tailored weaponry',
    icon: <Sparkles className="w-4 h-4" />,
    tone: 'accent',
    group: 'core',
  },
  {
    id: 'kanban',
    name: 'Kanban Pipeline',
    shortName: 'Kanban',
    subtitle: '5-stage tracker & velocity',
    icon: <Kanban className="w-4 h-4" />,
    tone: 'info',
    group: 'core',
  },
  {
    id: 'learning',
    name: 'Learning Sync',
    shortName: 'Learning',
    subtitle: 'Skill matrix & xAPI LRS',
    icon: <GraduationCap className="w-4 h-4" />,
    tone: 'caution',
    group: 'core',
  },
  {
    id: 'oracle',
    name: 'Sponsorship Oracle',
    shortName: 'Oracle',
    subtitle: 'Deterministic eligibility verdicts',
    icon: <ShieldCheck className="w-4 h-4" />,
    tone: 'positive',
    group: 'platform',
  },
  {
    id: 'marketplace',
    name: 'MCP Marketplace',
    shortName: 'MCP',
    subtitle: 'Registry & stdio servers',
    icon: <Layers className="w-4 h-4" />,
    tone: 'accent2',
    group: 'platform',
  },
  {
    id: 'orchestrator',
    name: 'Agent Canvas',
    shortName: 'Canvas',
    subtitle: 'Visual swarm & human gate',
    icon: <Cpu className="w-4 h-4" />,
    tone: 'accent',
    group: 'platform',
  },
  {
    id: 'hivemind',
    name: 'Community Radar',
    shortName: 'Radar',
    subtitle: 'Ghost jobs & visa heatmap',
    icon: <TrendingUp className="w-4 h-4" />,
    tone: 'critical',
    group: 'platform',
  },
];

export const WORKSPACE_GROUPS: { id: WorkspaceDef['group']; label: string }[] = [
  { id: 'core', label: 'Core Workspaces' },
  { id: 'platform', label: 'PaaS & Agent Swarm' },
];

export const workspacesIn = (group: WorkspaceDef['group']): WorkspaceDef[] =>
  WORKSPACES.filter((workspace) => workspace.group === group);
