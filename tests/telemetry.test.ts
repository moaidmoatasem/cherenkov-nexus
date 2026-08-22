import { describe, it, expect } from "vitest";
import type { Client } from "@libsql/client";
import {
  REPORTED_DEPENDENCIES,
  collectTelemetry,
  readDependencyVersions,
  resolveInference,
} from "../src/server/telemetry";

/**
 * The telemetry panel used to print four figures nothing produced — a 99.8%
 * scraper success rate, 412ms latency, 100% AST integrity, and "114,820 UK
 * Sponsors Indexed" under the label *Live Home Office DB*, when the register
 * holds 126,998 rows.
 *
 * These pin the property that replaced them: a figure is either counted, or it
 * comes back null with a reason. Nothing is defaulted to a plausible number.
 */

/** A database that answers COUNT(*) from a fixed table of row counts. */
function countingDb(counts: Record<string, number>): Client {
  return {
    execute: async (sql: string) => {
      const table = /FROM (\w+)/.exec(String(sql))?.[1] ?? "";
      if (!(table in counts)) throw new Error(`no such table: ${table}`);
      return { rows: [{ n: counts[table] }] } as never;
    },
  } as unknown as Client;
}

const unreachableDb = {
  execute: async () => {
    throw new Error("SQLITE_CORRUPT: database disk image is malformed");
  },
} as unknown as Client;

const NO_MCP = { ready: false, servers: [] };

describe("collectTelemetry — counts come from the database", () => {
  it("reports the real number of register rows", async () => {
    const snapshot = await collectTelemetry({
      db: countingDb({ sponsors: 126998, kanban_tasks: 3 }),
      mcp: NO_MCP,
      port: 3000,
      dependencyVersions: {},
    });

    expect(snapshot.sponsorsIndexed).toEqual({ value: 126998 });
    expect(snapshot.applicationsStored).toEqual({ value: 3 });
  });

  it("reports null with a reason rather than a plausible number", async () => {
    const snapshot = await collectTelemetry({
      db: unreachableDb,
      mcp: NO_MCP,
      port: 3000,
      dependencyVersions: {},
    });

    expect(snapshot.sponsorsIndexed.value).toBeNull();
    expect(snapshot.sponsorsIndexed.reason).toContain("SQLITE_CORRUPT");
    expect(snapshot.applicationsStored.value).toBeNull();
  });

  it("treats a missing table as unavailable, not as zero", async () => {
    const snapshot = await collectTelemetry({
      db: countingDb({ sponsors: 126998 }),
      mcp: NO_MCP,
      port: 3000,
      dependencyVersions: {},
    });

    expect(snapshot.sponsorsIndexed.value).toBe(126998);
    expect(snapshot.applicationsStored.value).toBeNull();
  });
});

describe("collectTelemetry — MCP figures are summed from connected servers only", () => {
  it("excludes tools belonging to a server that is not connected", async () => {
    const snapshot = await collectTelemetry({
      db: countingDb({ sponsors: 1, kanban_tasks: 0 }),
      mcp: {
        ready: true,
        servers: [
          { connected: true, toolNames: ["a", "b", "c"] },
          { connected: true, toolNames: ["d"] },
          { connected: false, toolNames: ["e", "f"] },
        ],
      },
      port: 3000,
      dependencyVersions: {},
    });

    expect(snapshot.mcp).toEqual({
      ready: true,
      serversKnown: 3,
      serversConnected: 2,
      toolsExposed: 4,
    });
  });
});

describe("resolveInference — names the engine a request would actually reach", () => {
  it("reports Gemini and its model when a key is present", () => {
    expect(resolveInference({ GEMINI_API_KEY: "k" } as NodeJS.ProcessEnv)).toEqual({
      engine: "gemini",
      model: "gemini-3.7-flash",
    });
  });

  it("honours an overridden model", () => {
    expect(
      resolveInference({ GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-x" } as NodeJS.ProcessEnv)
    ).toEqual({ engine: "gemini", model: "gemini-x" });
  });

  it("falls back to a configured local endpoint", () => {
    expect(
      resolveInference({ LOCAL_LLM_ENDPOINT: "http://127.0.0.1:11434" } as NodeJS.ProcessEnv)
    ).toEqual({ engine: "local", model: null });
  });

  it("says nothing is configured rather than naming a model", () => {
    expect(resolveInference({} as NodeJS.ProcessEnv)).toEqual({ engine: "none", model: null });
  });
});

describe("readDependencyVersions — versions come from the manifest", () => {
  it("matches what package.json actually declares", () => {
    const versions = readDependencyVersions();
    const manifest = JSON.parse(
      require("node:fs").readFileSync("package.json", "utf8")
    );
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };

    for (const name of REPORTED_DEPENDENCIES) {
      if (declared[name]) {
        expect(versions[name]).toBe(declared[name].replace(/^[\^~]/, ""));
      }
    }
  });

  it("reports React 19, not the 18 the panel used to claim", () => {
    expect(readDependencyVersions().react.startsWith("19.")).toBe(true);
  });

  it("returns nothing rather than inventing versions when the manifest is missing", () => {
    expect(readDependencyVersions("/nonexistent-directory")).toEqual({});
  });
});
