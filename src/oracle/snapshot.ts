/**
 * Rules snapshots — loading, integrity, and diffing.
 *
 * W1 in the operations doc calls the rules pipeline "the company". A stale or
 * silently-mutated snapshot produces confidently wrong verdicts, and being
 * right is the product's only asset. So:
 *
 *  - snapshots are content-addressed, and the hash is recomputed on load
 *  - an unverified snapshot marks every verdict it produces as PROVISIONAL
 *  - diffing two snapshots names exactly which rows moved, so affected saved
 *    checks can be re-flagged (AC-6, journey J4)
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { OccupationRow, RulesSnapshot } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Integrity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical JSON: object keys sorted at every depth, no insertion-order
 * dependence. Two snapshots with the same content hash to the same value
 * regardless of how the file was written.
 */
export function canonicalise(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(",")}}`;
}

/** sha256 over the canonical form, first 12 hex chars. */
export function contentHash(snapshot: Omit<RulesSnapshot, "id">): string {
  return createHash("sha256").update(canonicalise(snapshot)).digest("hex").slice(0, 12);
}

export function expectedId(snapshot: Omit<RulesSnapshot, "id">): string {
  return `${snapshot.route}-${snapshot.effectiveDate}+${contentHash(snapshot)}`;
}

export class SnapshotIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotIntegrityError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_CITATIONS = [
  "generalSalaryThreshold",
  "hourlyFloor",
  "skillLevel",
  "english",
  "goingRate",
  "occupationEligibility",
] as const;

/**
 * Structural validation. Deliberately strict — a malformed snapshot must fail
 * loudly at load, never degrade into a verdict.
 */
export function validateSnapshot(raw: unknown): RulesSnapshot {
  if (typeof raw !== "object" || raw === null) {
    throw new SnapshotIntegrityError("Snapshot is not an object");
  }
  const s = raw as Record<string, unknown>;

  const problems: string[] = [];

  if (s.route !== "uk-skilled-worker") problems.push(`unsupported route "${String(s.route)}"`);
  if (typeof s.effectiveDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.effectiveDate)) {
    problems.push("effectiveDate must be an ISO date (YYYY-MM-DD)");
  }
  if (typeof s.verified !== "boolean") problems.push("verified must be a boolean");

  for (const field of [
    "generalSalaryThresholdGbp",
    "hourlyFloorGbp",
    "goingRateHoursCap",
    "minRqfLevel",
  ]) {
    if (typeof s[field] !== "number" || !Number.isFinite(s[field] as number)) {
      problems.push(`${field} must be a finite number`);
    }
  }

  if (typeof s.minEnglishCefr !== "string") problems.push("minEnglishCefr must be a CEFR level");

  const citations = s.citations as Record<string, unknown> | undefined;
  if (!citations || typeof citations !== "object") {
    problems.push("citations block is missing");
  } else {
    for (const key of REQUIRED_CITATIONS) {
      const c = citations[key] as Record<string, unknown> | undefined;
      if (!c || typeof c.authority !== "string" || c.authority.length === 0) {
        problems.push(`citations.${key} must name an authority`);
      }
    }
  }

  if (!Array.isArray(s.tradeableOptions)) problems.push("tradeableOptions must be an array");

  const occupations = s.occupations as Record<string, unknown> | undefined;
  if (!occupations || typeof occupations !== "object") {
    problems.push("occupations must be an object keyed by SOC code");
  } else {
    for (const [code, row] of Object.entries(occupations)) {
      const r = row as Record<string, unknown>;
      if (r.code !== code) problems.push(`occupations["${code}"].code does not match its key`);
      if (typeof r.goingRateGbp !== "number") problems.push(`occupations["${code}"].goingRateGbp missing`);
      if (typeof r.goingRateBasisHours !== "number" || (r.goingRateBasisHours as number) <= 0) {
        problems.push(`occupations["${code}"].goingRateBasisHours must be > 0`);
      }
      if (typeof r.rqfLevel !== "number") problems.push(`occupations["${code}"].rqfLevel missing`);
      if (typeof r.eligible !== "boolean") problems.push(`occupations["${code}"].eligible missing`);
      if (typeof r.tableRef !== "string") problems.push(`occupations["${code}"].tableRef missing`);
    }
  }

  const provenance = s.provenance as Record<string, unknown> | undefined;
  if (!provenance || !Array.isArray(provenance.sources)) {
    problems.push("provenance.sources must list the primary sources this snapshot was read from");
  }

  if (problems.length > 0) {
    throw new SnapshotIntegrityError(
      `Snapshot failed validation:\n  - ${problems.join("\n  - ")}`
    );
  }

  const snapshot = s as unknown as RulesSnapshot;

  // Integrity: the id must match the content. A hand-edited snapshot whose id
  // was not regenerated is a defect, not a convenience.
  const { id: _declaredId, ...body } = snapshot;
  const expected = expectedId(body);
  if (snapshot.id !== expected) {
    throw new SnapshotIntegrityError(
      `Snapshot id does not match its content.\n  declared: ${snapshot.id}\n  expected: ${expected}\n` +
        `Regenerate with \`npm run oracle:seal\` after editing a snapshot.`
    );
  }

  return snapshot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────────────────────

export const SNAPSHOT_DIR = resolve(process.cwd(), "data", "snapshots");

export function listSnapshots(dir: string = SNAPSHOT_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

export function loadSnapshotFile(path: string): RulesSnapshot {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return validateSnapshot(raw);
}

let cached: RulesSnapshot | null = null;

/**
 * The snapshot the API serves. Latest by effective date.
 *
 * Cached because it is immutable by construction — if the file changes on
 * disk, that is a new snapshot and it gets a new id.
 */
export function currentSnapshot(dir: string = SNAPSHOT_DIR): RulesSnapshot {
  if (cached) return cached;
  const files = listSnapshots(dir);
  if (files.length === 0) {
    throw new SnapshotIntegrityError(
      `No rules snapshots found in ${dir}. The Oracle cannot produce a verdict without one.`
    );
  }
  const loaded = files.map((f) => loadSnapshotFile(join(dir, f)));
  loaded.sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  cached = loaded[0];
  return cached;
}

/** Test seam. */
export function resetSnapshotCache(): void {
  cached = null;
}

/**
 * Age of a snapshot in whole days, against a caller-supplied clock.
 *
 * The clock is a parameter, not `Date.now()`, so that everything downstream of
 * the evaluator stays as testable as the evaluator itself.
 */
export function snapshotAgeDays(snapshot: RulesSnapshot, now: Date): number {
  const effective = new Date(`${snapshot.effectiveDate}T00:00:00Z`).getTime();
  return Math.floor((now.getTime() - effective) / 86_400_000);
}

/** Operations doc J6: a banner fires past this age. */
export const STALE_SNAPSHOT_DAYS = 14;

// ─────────────────────────────────────────────────────────────────────────────
// Diffing (AC-6 · journey J4)
// ─────────────────────────────────────────────────────────────────────────────

export interface SnapshotDiff {
  from: string;
  to: string;
  /** Route-wide parameters that moved. */
  globals: Array<{ field: string; from: unknown; to: unknown }>;
  occupationsAdded: string[];
  occupationsRemoved: string[];
  occupationsChanged: Array<{
    code: string;
    changes: Array<{ field: keyof OccupationRow; from: unknown; to: unknown }>;
  }>;
  /** True when anything that can move a verdict has changed. */
  material: boolean;
}

const GLOBAL_FIELDS = [
  "generalSalaryThresholdGbp",
  "hourlyFloorGbp",
  "goingRateHoursCap",
  "minRqfLevel",
  "minEnglishCefr",
] as const;

const OCCUPATION_FIELDS: Array<keyof OccupationRow> = [
  "goingRateGbp",
  "goingRateBasisHours",
  "rqfLevel",
  "eligible",
];

export function diffSnapshots(a: RulesSnapshot, b: RulesSnapshot): SnapshotDiff {
  const globals: SnapshotDiff["globals"] = [];
  for (const field of GLOBAL_FIELDS) {
    if (a[field] !== b[field]) globals.push({ field, from: a[field], to: b[field] });
  }

  const aCodes = new Set(Object.keys(a.occupations));
  const bCodes = new Set(Object.keys(b.occupations));

  const occupationsAdded = [...bCodes].filter((c) => !aCodes.has(c)).sort();
  const occupationsRemoved = [...aCodes].filter((c) => !bCodes.has(c)).sort();

  const occupationsChanged: SnapshotDiff["occupationsChanged"] = [];
  for (const code of [...aCodes].filter((c) => bCodes.has(c)).sort()) {
    const before = a.occupations[code];
    const after = b.occupations[code];
    const changes = OCCUPATION_FIELDS.filter((f) => before[f] !== after[f]).map((f) => ({
      field: f,
      from: before[f],
      to: after[f],
    }));
    if (changes.length > 0) occupationsChanged.push({ code, changes });
  }

  return {
    from: a.id,
    to: b.id,
    globals,
    occupationsAdded,
    occupationsRemoved,
    occupationsChanged,
    material:
      globals.length > 0 ||
      occupationsChanged.length > 0 ||
      occupationsRemoved.length > 0,
  };
}

/**
 * Which of a set of previously-checked occupation codes are affected by a diff.
 *
 * This is the input to J4's re-flagging: take the saved checks, ask which ones
 * the new snapshot could move, and re-run only those.
 */
export function codesAffectedBy(diff: SnapshotDiff, checkedCodes: string[]): string[] {
  if (diff.globals.length > 0) return [...new Set(checkedCodes)].sort();
  const moved = new Set([
    ...diff.occupationsChanged.map((c) => c.code),
    ...diff.occupationsRemoved,
  ]);
  return [...new Set(checkedCodes.filter((c) => moved.has(c)))].sort();
}
