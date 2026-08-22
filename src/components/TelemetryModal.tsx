import React, { useEffect, useState } from 'react';
import {
  Activity,
  X,
  Layers,
  Database,
  Server,
  Cpu,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Modal } from './ui';

/**
 * What the system can report about itself — and nothing else.
 *
 * This panel used to open with "ALL SYSTEMS OPERATIONAL" over four hardcoded
 * figures: a 99.8% scraper success rate, 412ms average latency, 100% AST schema
 * integrity, and "114,820 UK Sponsors Indexed" labelled *Live Home Office DB*.
 * Nothing measured any of them, and the sponsor count was wrong — the register
 * holds 126,998 rows. The runtime list was stale in every entry (React 18 for
 * 19, Playwright 1.42 for 1.62, Recharts 2.12 for 3.10), and three sub-agents
 * reported HEALTHY / SYNCED / RESONATING without a probe behind any of them.
 *
 * Every figure below now comes from `/api/telemetry`. Where the backend cannot
 * measure something it says so, and this renders "unavailable" rather than a
 * number that reads as fact.
 */

interface Measured<T> {
  value: T | null;
  reason?: string;
}

interface TelemetrySnapshot {
  sponsorsIndexed: Measured<number>;
  applicationsStored: Measured<number>;
  inference: { engine: 'gemini' | 'local' | 'none'; model: string | null };
  mcp: { ready: boolean; serversKnown: number; serversConnected: number; toolsExposed: number };
  database: { driver: string; location: 'local-file' | 'remote' };
  runtime: { node: string; uptimeSeconds: number; port: number };
  dependencies: Record<string, string>;
}

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatUptime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const INFERENCE_LABEL: Record<TelemetrySnapshot['inference']['engine'], string> = {
  gemini: 'Google Gemini',
  local: 'Local endpoint',
  none: 'Not configured'
};

/** One measured figure, or an honest blank where the value could not be read. */
const Metric: React.FC<{
  label: string;
  value: string | null;
  note: string;
  testId?: string;
}> = ({ label, value, note, testId }) => (
  <div className="p-4 rounded-card bg-sunken border border-line space-y-1">
    <div className="text-2xs font-mono uppercase text-ink-muted">{label}</div>
    <div
      data-testid={testId}
      className={`text-xl font-mono font-black ${value === null ? 'text-ink-faint' : 'text-ink'}`}
    >
      {value ?? 'Unavailable'}
    </div>
    <div className="text-2xs text-ink-faint font-mono">{note}</div>
  </div>
);

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose }) => {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Read on open rather than once at mount, so reopening the panel shows the
  // current state instead of whatever was true the first time.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSnapshot(null);
    setError(null);

    fetch('/api/telemetry')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mcp = snapshot?.mcp;
  const inference = snapshot?.inference;

  return (
    <Modal open={isOpen} onClose={onClose} label="Telemetry & observability">
      <div
        className="w-full max-w-3xl bg-surface border border-line rounded-panel shadow-pop overflow-hidden flex flex-col max-h-[85vh] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-control bg-fill text-ink-muted border border-line">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink">System Telemetry</h2>
              <p className="text-sm text-ink-muted">
                Read from the running server. Only what can be measured is shown.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close telemetry"
            className="p-2 rounded-control text-ink-muted hover:text-ink hover:bg-fill-strong transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-ink-muted text-xs">
          {error && (
            <div
              data-testid="telemetry-error"
              className="p-4 rounded-card bg-critical-soft border border-critical-line flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-critical-ink shrink-0 mt-0.5" />
              <p className="text-sm text-critical-ink leading-relaxed">
                Could not reach the telemetry endpoint ({error}). Nothing is shown rather than
                a cached or assumed figure.
              </p>
            </div>
          )}

          {!snapshot && !error && (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Reading from the server…</span>
            </div>
          )}

          {snapshot && (
            <>
              {/* Measured figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric
                  testId="telemetry-sponsors"
                  label="Sponsors indexed"
                  value={
                    snapshot.sponsorsIndexed.value === null
                      ? null
                      : snapshot.sponsorsIndexed.value.toLocaleString()
                  }
                  note={snapshot.sponsorsIndexed.reason ?? 'Rows in the register table'}
                />
                <Metric
                  testId="telemetry-applications"
                  label="Applications stored"
                  value={
                    snapshot.applicationsStored.value === null
                      ? null
                      : String(snapshot.applicationsStored.value)
                  }
                  note={snapshot.applicationsStored.reason ?? 'Rows persisted server-side'}
                />
                <Metric
                  testId="telemetry-tools"
                  label="MCP tools exposed"
                  value={String(snapshot.mcp.toolsExposed)}
                  note={`${snapshot.mcp.serversConnected} of ${snapshot.mcp.serversKnown} servers connected`}
                />
                <Metric
                  testId="telemetry-uptime"
                  label="Server uptime"
                  value={formatUptime(snapshot.runtime.uptimeSeconds)}
                  note={`Node ${snapshot.runtime.node}`}
                />
              </div>

              {/* Subsystems. Each row states its evidence, or that it has none. */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase font-bold text-ink flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ink-muted" />
                  <span>Subsystems</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-ink-muted shrink-0" />
                      <div>
                        <div className="font-semibold text-ink">Inference engine</div>
                        <div className="text-xs text-ink-muted font-mono">
                          {inference?.model ?? 'No model would be called'}
                        </div>
                      </div>
                    </div>
                    <span
                      data-testid="telemetry-engine"
                      className={`text-2xs font-mono px-2 py-0.5 rounded border shrink-0 ${
                        inference?.engine === 'none'
                          ? 'bg-caution-soft text-caution-ink border-caution-line'
                          : 'bg-positive-soft text-positive-ink border-positive-line'
                      }`}
                    >
                      {INFERENCE_LABEL[inference?.engine ?? 'none']}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-ink-muted shrink-0" />
                      <div>
                        <div className="font-semibold text-ink">MCP host</div>
                        <div className="text-xs text-ink-muted font-mono">
                          {snapshot.mcp.serversConnected} connected · {snapshot.mcp.toolsExposed} tools
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-2xs font-mono px-2 py-0.5 rounded border shrink-0 ${
                        mcp?.ready
                          ? 'bg-positive-soft text-positive-ink border-positive-line'
                          : 'bg-caution-soft text-caution-ink border-caution-line'
                      }`}
                    >
                      {mcp?.ready ? 'CONNECTED' : 'DEGRADED'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-ink-muted shrink-0" />
                      <div>
                        <div className="font-semibold text-ink">Database</div>
                        <div className="text-xs text-ink-muted font-mono">
                          {snapshot.database.driver} ·{' '}
                          {snapshot.database.location === 'remote'
                            ? 'remote instance'
                            : 'local file (WAL)'}
                        </div>
                      </div>
                    </div>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-fill text-ink-muted border border-line shrink-0">
                      {snapshot.sponsorsIndexed.value === null ? 'UNREADABLE' : 'READABLE'}
                    </span>
                  </div>

                  {/* The ATS scraper has no health probe. Saying so beats the
                      "HEALTHY" pill that used to sit here unconditionally. */}
                  <div className="p-3.5 rounded-card bg-sunken border border-line flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-ink-muted shrink-0" />
                      <div>
                        <div className="font-semibold text-ink">ATS scraper</div>
                        <div className="text-xs text-ink-muted font-mono">
                          Runs on demand; success is not sampled between requests
                        </div>
                      </div>
                    </div>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-fill text-ink-muted border border-line shrink-0">
                      NO PROBE
                    </span>
                  </div>
                </div>
              </div>

              {/* Versions resolved from package.json, not typed in here. */}
              {Object.keys(snapshot.dependencies).length > 0 && (
                <div className="p-4 rounded-card bg-sunken border border-line space-y-2">
                  <div className="text-xs font-mono uppercase text-ink-muted font-bold">
                    Shipped versions
                  </div>
                  <div
                    data-testid="telemetry-dependencies"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-ink-muted"
                  >
                    {Object.entries(snapshot.dependencies).map(([name, version]) => (
                      <div key={name} className="truncate">
                        <span className="text-ink">{name}</span> {version}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-sunken flex items-center justify-between text-xs font-mono">
          <div className="text-ink-muted">
            {snapshot ? (
              <>
                Listening on port <span className="text-ink">{snapshot.runtime.port}</span>
              </>
            ) : (
              <span className="text-ink-faint">—</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-control bg-fill-strong hover:bg-fill-strong text-ink font-medium transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
