/**
 * Rules ingestion pipeline — the publish gate.
 *
 *   fetch → checksum → parse → validate → diff → [sign-off] → seal → publish
 *
 * The operations doc is blunt about why this exists:
 *
 *   > A stale snapshot produces confidently wrong verdicts, and the product's
 *   > only asset is being right. Everything else is a website. This is the
 *   > company.  — NEXUS_V1_DESIGN_AND_OPERATIONS §3.1
 *
 * and gives four non-negotiables. Three of them are enforced here:
 *
 *   1. Never auto-publish a diff that changes verdicts. A material diff halts
 *      and requires human sign-off. An automated pipeline silently shipping a
 *      bad parse is how this product dies.
 *   2. Snapshots are immutable and addressable — the proposal is sealed with
 *      its own content hash before it can be published.
 *   4. Golden-set regression runs against every candidate. A known-good verdict
 *      that flips without a corresponding rule change blocks the publish.
 *
 * (The third — "alert on absence", i.e. the register going quiet for 72 hours —
 * is a scheduling concern and belongs with whatever runs this, not here.)
 *
 * ─── The parser seam ─────────────────────────────────────────────────────────
 *
 * `parse` is injected and this module ships no gov.uk parser. That is
 * deliberate rather than unfinished: Appendix Skilled Occupations was not
 * reachable from the environment this was written in, so any parser would have
 * been written against a guessed page structure and could not be validated.
 * Writing one anyway would reproduce the exact failure the Oracle exists to
 * prevent — confident output from unverified input.
 *
 * Everything up-stream and down-stream of the parser is real, and the gate
 * below will refuse a bad parse rather than trust it.
 */

import { createHash } from "node:crypto";
import {
  diffSnapshots,
  expectedId,
  validateSnapshot,
  type SnapshotDiff,
} from "./snapshot";
import type { RulesSnapshot } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchedSource {
  /** Where it came from, recorded in the snapshot's provenance. */
  url: string;
  /** Raw body, exactly as served. */
  body: string;
  /** ISO timestamp. Supplied by the caller, never Date.now(). */
  fetchedAt: string;
}

/** sha256 of a fetched body. Change detection starts here. */
export function sourceHash(source: FetchedSource): string {
  return createHash("sha256").update(source.body).digest("hex");
}

/**
 * What a parser must produce: the rules body of a snapshot, minus the parts
 * the pipeline supplies itself (`id`, `verified`, `provenance`).
 */
export type ParsedRules = Omit<RulesSnapshot, "id" | "verified" | "provenance">;

export type ParseResult =
  | { ok: true; rules: ParsedRules }
  | { ok: false; reason: string };

/** One hand-verified scenario the pipeline re-checks before publishing. */
export interface GoldenCase {
  name: string;
  /** Run the case against a candidate snapshot; return the outcome to compare. */
  run: (snapshot: RulesSnapshot) => string;
  /** The outcome this case produced under the current snapshot. */
  expected: string;
}

export interface PipelineInput {
  source: FetchedSource;
  parse: (source: FetchedSource) => ParseResult;
  /** The snapshot in force. Null on a first run. */
  current: RulesSnapshot | null;
  /** Hash of the source the current snapshot was built from, if known. */
  currentSourceHash?: string;
  /** Hand-verified scenarios. Empty is allowed but reported. */
  golden?: GoldenCase[];
  /** Who or what ran this, recorded in provenance. */
  compiledBy: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Outcomes
// ─────────────────────────────────────────────────────────────────────────────

export interface GoldenFailure {
  name: string;
  expected: string;
  actual: string;
}

export type PipelineOutcome =
  /** Source byte-identical to last run. Nothing to do. */
  | { status: "unchanged"; sourceHash: string }
  /** Fetch/parse/validation failed. Nothing is published. */
  | { status: "failed"; reason: string; sourceHash: string }
  /** A known-good verdict flipped without an intended rule change. */
  | { status: "regressed"; failures: GoldenFailure[]; diff: SnapshotDiff; sourceHash: string }
  /** Material change — verdicts move. Requires human sign-off (W1 §1). */
  | {
      status: "needs_signoff";
      proposed: RulesSnapshot;
      diff: SnapshotDiff;
      summary: string;
      sourceHash: string;
    }
  /** Non-material change, or a first run. Safe to publish. */
  | { status: "ready"; proposed: RulesSnapshot; diff: SnapshotDiff | null; sourceHash: string };

// ─────────────────────────────────────────────────────────────────────────────
// The gate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the pipeline. Never writes anything — it returns a decision.
 *
 * Publishing is a separate, explicit step (`publish`), so that "the pipeline
 * ran" and "a new snapshot is live" can never be the same event by accident.
 */
export function runPipeline(input: PipelineInput): PipelineOutcome {
  const { source, parse, current, currentSourceHash, golden = [], compiledBy } = input;
  const hash = sourceHash(source);

  // 1 · Change detection. An unchanged source is the common case and must be
  //     cheap — no parse, no diff, no work.
  if (currentSourceHash && currentSourceHash === hash) {
    return { status: "unchanged", sourceHash: hash };
  }

  // 2 · Parse. A failure here is where a bad ingestion would otherwise start.
  let parsed: ParseResult;
  try {
    parsed = parse(source);
  } catch (err) {
    return {
      status: "failed",
      reason: `Parser threw: ${err instanceof Error ? err.message : String(err)}`,
      sourceHash: hash,
    };
  }
  if (!parsed.ok) {
    return { status: "failed", reason: `Parse failed: ${parsed.reason}`, sourceHash: hash };
  }

  // 3 · Assemble a candidate.
  //
  //     `verified` is always false here and the pipeline has no way to set it
  //     true. Verification is a human act — it means somebody read the source
  //     table and signed their name to it — so an automated run must never be
  //     able to claim it.
  const body = {
    ...parsed.rules,
    verified: false,
    provenance: {
      compiledBy,
      compiledAt: source.fetchedAt,
      sources: [source.url],
      caveats: [
        `Ingested automatically from ${source.url} (sha256 ${hash.slice(0, 12)}).`,
        "Not verified. A human must read the source table and sign off before this is marked verified.",
      ],
    },
  } as Omit<RulesSnapshot, "id">;

  const proposed = { ...body, id: expectedId(body) } as RulesSnapshot;

  // 4 · Structural validation, using the same validator the loader uses. A
  //     candidate that could not be loaded must not be publishable.
  try {
    validateSnapshot(proposed);
  } catch (err) {
    return {
      status: "failed",
      reason: `Candidate failed validation: ${err instanceof Error ? err.message : String(err)}`,
      sourceHash: hash,
    };
  }

  // 5 · First run — nothing to diff against.
  if (!current) {
    return { status: "ready", proposed, diff: null, sourceHash: hash };
  }

  const diff = diffSnapshots(current, proposed);

  // 6 · Golden-set regression (W1 §4). Run before the material check so a
  //     parse that silently mangles rows is caught as a regression rather than
  //     being handed to a reviewer as a legitimate-looking rule change.
  const failures: GoldenFailure[] = [];
  for (const c of golden) {
    let actual: string;
    try {
      actual = c.run(proposed);
    } catch (err) {
      actual = `threw: ${err instanceof Error ? err.message : String(err)}`;
    }
    if (actual !== c.expected) failures.push({ name: c.name, expected: c.expected, actual });
  }
  if (failures.length > 0) {
    return { status: "regressed", failures, diff, sourceHash: hash };
  }

  // 7 · Material change halts for sign-off (W1 §1).
  if (diff.material) {
    return {
      status: "needs_signoff",
      proposed,
      diff,
      summary: summariseDiff(diff),
      sourceHash: hash,
    };
  }

  return { status: "ready", proposed, diff, sourceHash: hash };
}

/** One-line-per-change summary, for a reviewer and for the audit log. */
export function summariseDiff(diff: SnapshotDiff): string {
  const lines: string[] = [];
  for (const g of diff.globals) {
    lines.push(`${g.field}: ${String(g.from)} → ${String(g.to)}`);
  }
  for (const o of diff.occupationsChanged) {
    for (const c of o.changes) {
      lines.push(`${o.code}.${String(c.field)}: ${String(c.from)} → ${String(c.to)}`);
    }
  }
  if (diff.occupationsAdded.length > 0) {
    lines.push(`added: ${diff.occupationsAdded.join(", ")}`);
  }
  if (diff.occupationsRemoved.length > 0) {
    lines.push(`removed: ${diff.occupationsRemoved.join(", ")}`);
  }
  return lines.length > 0 ? lines.join("\n") : "no changes";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-off and publish
// ─────────────────────────────────────────────────────────────────────────────

export interface SignOff {
  /** Who read the source and is accountable for the result. */
  approvedBy: string;
  /** ISO timestamp of the approval. */
  approvedAt: string;
  /** Free text — what they checked, and against what. */
  note: string;
  /**
   * Whether the approver actually read the source tables, as opposed to only
   * eyeballing the diff. Only a true value may mark a snapshot verified.
   */
  readSourceTables: boolean;
}

export class UnapprovedPublishError extends Error {
  constructor(status: string) {
    super(
      `Refusing to publish a snapshot with status "${status}" without sign-off. ` +
        `A material rules change must be approved by a human (W1 §1).`
    );
    this.name = "UnapprovedPublishError";
  }
}

/**
 * Turn a pipeline outcome into a publishable snapshot.
 *
 * `needs_signoff` requires a `SignOff`; without one this throws rather than
 * publishing. `failed` and `regressed` are never publishable at all.
 *
 * Marking a snapshot `verified` requires an approver who states they read the
 * source tables — the diff alone is not enough, because a diff cannot show you
 * a row that was wrong in both snapshots.
 */
export function publish(outcome: PipelineOutcome, signOff?: SignOff): RulesSnapshot {
  if (outcome.status === "unchanged" || outcome.status === "failed" || outcome.status === "regressed") {
    throw new UnapprovedPublishError(outcome.status);
  }

  if (outcome.status === "needs_signoff" && !signOff) {
    throw new UnapprovedPublishError(outcome.status);
  }

  const base = outcome.proposed;
  if (!signOff) return base;

  // Drop the candidate's id before re-hashing. Leaving it in would fold the
  // stale id into the content hash, so the new id would describe an object
  // that no longer exists and the snapshot would fail its own seal check.
  const { id: _staleId, ...withoutId } = base;

  const verified = signOff.readSourceTables;
  const body = {
    ...withoutId,
    verified,
    provenance: {
      ...base.provenance,
      caveats: [
        ...base.provenance.caveats.filter((c) => !c.startsWith("Not verified.")),
        `Signed off by ${signOff.approvedBy} at ${signOff.approvedAt}: ${signOff.note}`,
        ...(verified
          ? []
          : ["Approved for publication but NOT verified — the approver did not read the source tables."]),
      ],
    },
  } as Omit<RulesSnapshot, "id">;

  // Re-seal: the content changed, so the old id no longer describes it.
  return { ...body, id: expectedId(body) } as RulesSnapshot;
}

/** Convenience for callers that want to confirm a snapshot is sealed. */
export function isSealed(snapshot: RulesSnapshot): boolean {
  const { id, ...body } = snapshot;
  return id === expectedId(body);
}
