import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Client } from "@libsql/client";

/**
 * What the system can actually say about itself.
 *
 * The telemetry modal used to render four hardcoded figures — a 99.8% scraper
 * success rate, 412ms average latency, 100% AST schema integrity, and "114,820
 * UK Sponsors Indexed" labelled *Live Home Office DB*. Nothing measured any of
 * them, and the sponsor count was wrong: the register holds 126,998 rows.
 *
 * Everything below is either read from the running process, counted in SQLite,
 * or resolved from the manifest. A value that cannot be obtained comes back as
 * `null` with a `reason`, so the UI can say "unavailable" instead of guessing.
 */

/** A number we tried to measure, and what happened if we couldn't. */
export interface Measured<T> {
  value: T | null;
  /** Present only when `value` is null. Shown to the user verbatim. */
  reason?: string;
}

export interface TelemetrySnapshot {
  /** Rows in the Register of Licensed Sponsors table. */
  sponsorsIndexed: Measured<number>;
  /** Applications currently persisted server-side. */
  applicationsStored: Measured<number>;
  inference: {
    /** Which engine a synthesis request would actually reach. */
    engine: "gemini" | "local" | "none";
    /** The model identifier that engine would be called with. */
    model: string | null;
  };
  mcp: {
    ready: boolean;
    serversKnown: number;
    serversConnected: number;
    toolsExposed: number;
  };
  database: {
    driver: string;
    /** Local file or a remote Turso instance — not the path, which is a secret. */
    location: "local-file" | "remote";
  };
  runtime: {
    node: string;
    uptimeSeconds: number;
    port: number;
  };
  /** Resolved from package.json rather than typed into the markup. */
  dependencies: Record<string, string>;
}

export interface McpStatusEntry {
  connected: boolean;
  toolNames: string[];
}

export interface TelemetryDeps {
  db: Client;
  mcp: { ready: boolean; servers: McpStatusEntry[] };
  port: number;
  /** Overridable so a test does not depend on the real manifest. */
  dependencyVersions?: Record<string, string>;
}

/** The libraries worth showing; anything absent is simply omitted. */
export const REPORTED_DEPENDENCIES = [
  "react",
  "express",
  "@libsql/client",
  "@google/genai",
  "@modelcontextprotocol/sdk",
  "framer-motion",
  "recharts",
  "@playwright/test",
];

/**
 * Read the shipped versions out of package.json.
 *
 * The modal used to list "React 18", "Playwright v1.42", "Recharts v2.12" and
 * "Framer Motion 12" as static text; every one of them had drifted.
 */
export function readDependencyVersions(cwd: string = process.cwd()): Record<string, string> {
  try {
    const manifest = JSON.parse(readFileSync(resolve(cwd, "package.json"), "utf8"));
    const all = { ...manifest.dependencies, ...manifest.devDependencies };
    const out: Record<string, string> = {};
    for (const name of REPORTED_DEPENDENCIES) {
      if (typeof all[name] === "string") out[name] = all[name].replace(/^[\^~]/, "");
    }
    return out;
  } catch {
    // A missing manifest is not worth failing the endpoint over; the UI just
    // shows nothing rather than a version it made up.
    return {};
  }
}

/** Which engine a synthesis request would genuinely reach, and with what model. */
export function resolveInference(env: NodeJS.ProcessEnv = process.env): TelemetrySnapshot["inference"] {
  if (env.GEMINI_API_KEY) {
    return { engine: "gemini", model: env.GEMINI_MODEL ?? "gemini-3.7-flash" };
  }
  if (env.LOCAL_LLM_ENDPOINT) {
    return { engine: "local", model: env.LOCAL_LLM_MODEL ?? null };
  }
  return { engine: "none", model: null };
}

async function countRows(db: Client, table: string): Promise<Measured<number>> {
  try {
    const result = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    return { value: Number(result.rows[0].n) };
  } catch (err) {
    // A table that has not been created yet is the normal first-run state, not
    // an error worth surfacing as a scary number.
    return { value: null, reason: err instanceof Error ? err.message : "unavailable" };
  }
}

export async function collectTelemetry({
  db,
  mcp,
  port,
  dependencyVersions,
}: TelemetryDeps): Promise<TelemetrySnapshot> {
  const [sponsorsIndexed, applicationsStored] = await Promise.all([
    countRows(db, "sponsors"),
    countRows(db, "kanban_tasks"),
  ]);

  const connected = mcp.servers.filter((server) => server.connected);
  const usesRemoteDb = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

  return {
    sponsorsIndexed,
    applicationsStored,
    inference: resolveInference(),
    mcp: {
      ready: mcp.ready,
      serversKnown: mcp.servers.length,
      serversConnected: connected.length,
      toolsExposed: connected.reduce((total, server) => total + server.toolNames.length, 0),
    },
    database: {
      driver: "@libsql/client",
      location: usesRemoteDb ? "remote" : "local-file",
    },
    runtime: {
      node: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      port,
    },
    dependencies: dependencyVersions ?? readDependencyVersions(),
  };
}
