import React, { useState } from 'react';
import { MasterProfile, ApplicationCard, TabId } from '../types';
import { WORKSPACE_GROUPS, WorkspaceDef, workspacesIn } from '../navigation';
import {
  ArrowUpRight,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Button, Card, IconTile, Segmented, cn, sectionLabelClass, toneRail } from './ui';

export type { TabId };

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  profile: MasterProfile;
  onOpenProfile: () => void;
  applications: ApplicationCard[];
  certCount: number;
  onOpenIdentityVault?: () => void;
  onOpenOnboarding?: () => void;
  onStartTour?: () => void;
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-elevated)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 'var(--radius-control)',
  boxShadow: 'var(--shadow-pop)',
  fontSize: '11px',
  color: 'var(--color-ink)',
  padding: '6px 10px',
};

const AXIS_TICK = { fill: 'var(--color-ink-faint)', fontSize: 10 } as const;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  onOpenProfile,
  applications,
  certCount,
  onOpenIdentityVault,
  onOpenOnboarding,
  onStartTour,
}) => {
  const [chartView, setChartView] = useState<'pipeline' | 'learning'>('pipeline');

  const countIn = (column: ApplicationCard['column']) =>
    applications.filter((application) => application.column === column).length;

  const pipelineChartData = [
    { name: 'Saved', count: countIn('Saved'), fill: 'var(--color-ink-faint)' },
    { name: 'Upskill', count: countIn('Upskilling'), fill: 'var(--color-caution)' },
    { name: 'Ready', count: countIn('Ready to Apply'), fill: 'var(--color-accent)' },
    { name: 'Sent', count: countIn('Applied'), fill: 'var(--color-info)' },
    { name: 'Interv.', count: countIn('Interviewing'), fill: 'var(--color-positive)' },
  ];

  const certs = profile.learning_certs ?? [];
  const learningChartData = [
    {
      name: 'Verified',
      count: certs.filter((cert) => cert.status === 'Completed').length,
      fill: 'var(--color-positive)',
    },
    {
      name: 'In-Flight',
      count: certs.filter((cert) => cert.status === 'In Progress').length,
      fill: 'var(--color-caution)',
    },
    { name: 'Total Stack', count: profile.tech_stack.length, fill: 'var(--color-info)' },
  ];

  /** Counts only appear where the number is the point of the row. */
  const countFor = (workspace: WorkspaceDef): number | null => {
    if (workspace.id === 'kanban') return applications.length;
    if (workspace.id === 'learning') return certCount;
    return null;
  };

  const renderNavRow = (workspace: WorkspaceDef) => {
    const isActive = activeTab === workspace.id;
    const count = countFor(workspace);

    return (
      <button
        key={workspace.id}
        type="button"
        onClick={() => onSelectTab(workspace.id)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative w-full flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-control text-left',
          'transition-colors duration-150 cursor-pointer group',
          isActive ? 'bg-accent-soft' : 'hover:bg-fill'
        )}
      >
        {isActive && (
          <span
            className={cn('absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full', toneRail[workspace.tone])}
          />
        )}

        <IconTile tone={workspace.tone} size="sm" solid={isActive} className={cn(!isActive && 'group-hover:text-ink')}>
          {workspace.icon}
        </IconTile>

        <span className="min-w-0 flex-1">
          <span className={cn('block text-[13px] font-semibold truncate', isActive ? 'text-ink' : 'text-ink-muted')}>
            {workspace.name}
          </span>
          <span className="block text-[11px] leading-4 text-ink-faint truncate">{workspace.subtitle}</span>
        </span>

        {count !== null && (
          <span
            className={cn(
              'shrink-0 min-w-5 px-1.5 py-0.5 rounded-chip text-[11px] font-mono font-bold tabular text-center',
              isActive ? 'bg-accent text-accent-contrast' : 'bg-fill-strong text-ink-muted'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden md:flex w-[17rem] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-canvas/70 p-3">
      {/* Workspace navigation ---------------------------------------------- */}
      {WORKSPACE_GROUPS.map((group) => (
        <nav key={group.id} className="space-y-0.5">
          <p className={cn(sectionLabelClass, 'px-3 pb-1.5')}>{group.label}</p>
          {workspacesIn(group.id).map(renderNavRow)}
        </nav>
      ))}

      {/* Quick launchers ---------------------------------------------------- */}
      <div className="space-y-1.5">
        <Button
          block
          variant="secondary"
          size="sm"
          onClick={onOpenIdentityVault}
          icon={<ShieldCheck className="w-3.5 h-3.5 text-info-ink" />}
          className="justify-start"
        >
          Zero-Trust Vault
        </Button>
        <Button
          block
          variant="secondary"
          size="sm"
          onClick={onOpenOnboarding}
          icon={<Sparkles className="w-3.5 h-3.5 text-accent-ink" />}
          className="justify-start"
        >
          Magic Import
        </Button>
      </div>

      {/* Live analytics ------------------------------------------------------ */}
      <Card padding="sm" className="space-y-3">
        <div className="space-y-2">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-info-ink shrink-0" />
            <span className={sectionLabelClass}>Live Analytics</span>
          </span>
          <Segmented
            className="w-full"
            aria-label="Analytics view"
            value={chartView}
            onChange={setChartView}
            options={[
              { value: 'pipeline', label: 'Pipeline', title: 'Pipeline Distribution' },
              { value: 'learning', label: 'Learning', title: 'Learning Sync' },
            ]}
          />
        </div>

        <div className="h-28 w-full -ml-1">
          {chartView === 'pipeline' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineChartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={22} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'var(--color-fill)' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {pipelineChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningChartData} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={64} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'var(--color-fill)' }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {learningChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-line text-[11px] font-mono tabular">
          <span className="text-ink-faint">{applications.length} Active Targets</span>
          <span className="text-positive-ink font-bold">{countIn('Interviewing')} Interviewing</span>
        </div>
      </Card>

      {/* Master profile anchor ------------------------------------------------ */}
      <Card padding="sm" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-positive-ink shrink-0" />
            <span className={cn(sectionLabelClass, 'truncate')}>Master Anchor</span>
          </span>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-accent-ink hover:text-accent-strong transition-colors cursor-pointer shrink-0"
          >
            Edit
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-ink truncate">{profile.name}</p>
          <p className="text-[11px] font-mono text-accent-ink truncate">{profile.title}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <span className="truncate">{profile.location}</span>
            <span aria-hidden>·</span>
            <span className="text-positive-ink font-semibold shrink-0">Visa Ready</span>
          </p>
        </div>

        <div className="pt-2.5 border-t border-line space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={sectionLabelClass}>Synchronized Stack</span>
            <span className="text-[11px] font-mono font-bold tabular text-positive-ink shrink-0">
              {profile.tech_stack.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {profile.tech_stack.slice(0, 5).map((tech) => (
              <Badge key={tech} font="mono">
                {tech}
              </Badge>
            ))}
            {profile.tech_stack.length > 5 && (
              <Badge font="mono">+{profile.tech_stack.length - 5}</Badge>
            )}
          </div>
        </div>

        {onOpenOnboarding && (
          <Button
            block
            variant="outline"
            onClick={onOpenOnboarding}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Agentic Onboarding Hub
          </Button>
        )}

        {onStartTour && (
          <Button block variant="ghost" onClick={onStartTour} icon={<HelpCircle className="w-3.5 h-3.5" />}>
            System Guided Tour
          </Button>
        )}
      </Card>

      {/* Status footer --------------------------------------------------------- */}
      <div className="mt-auto rounded-card border border-line bg-sunken px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={sectionLabelClass}>Cherenkov Pipeline</span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-positive-ink shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-positive" />
            ONLINE
          </span>
        </div>
        <p className="text-[11px] leading-4 text-ink-faint">
          Autonomous tailoring &amp; UK sponsorship verification.
        </p>
      </div>
    </aside>
  );
};
