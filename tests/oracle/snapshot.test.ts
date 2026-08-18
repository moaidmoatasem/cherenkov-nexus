import { describe, it, expect } from "vitest";
import {
  canonicalise,
  contentHash,
  codesAffectedBy,
  currentSnapshot,
  diffSnapshots,
  expectedId,
  snapshotAgeDays,
  validateSnapshot,
  SnapshotIntegrityError,
  STALE_SNAPSHOT_DAYS,
} from "../../src/oracle/snapshot";
import { rankSocCandidates, isAmbiguous, tokenise } from "../../src/oracle/soc";
import type { RulesSnapshot } from "../../src/oracle/types";

const snapshot = currentSnapshot();

describe("canonicalisation", () => {
  it("is insensitive to key order", () => {
    expect(canonicalise({ a: 1, b: 2 })).toBe(canonicalise({ b: 2, a: 1 }));
  });

  it("is sensitive to values", () => {
    expect(canonicalise({ a: 1 })).not.toBe(canonicalise({ a: 2 }));
  });

  it("preserves array order, which is meaningful", () => {
    expect(canonicalise([1, 2])).not.toBe(canonicalise([2, 1]));
  });

  it("recurses into nested objects", () => {
    expect(canonicalise({ x: { b: 1, a: 2 } })).toBe(canonicalise({ x: { a: 2, b: 1 } }));
  });
});

describe("snapshot integrity", () => {
  it("ships sealed — the declared id matches its content", () => {
    const { id, ...body } = snapshot;
    expect(id).toBe(expectedId(body));
  });

  it("rejects a snapshot whose content was edited without resealing", () => {
    const tampered = { ...snapshot, generalSalaryThresholdGbp: 1 };
    expect(() => validateSnapshot(tampered)).toThrow(SnapshotIntegrityError);
  });

  it("names the offending fields when structure is wrong", () => {
    const broken = { ...snapshot, minRqfLevel: "six" };
    expect(() => validateSnapshot(broken)).toThrow(/minRqfLevel must be a finite number/);
  });

  it("requires every citation to name an authority", () => {
    const broken = {
      ...snapshot,
      citations: { ...snapshot.citations, goingRate: { authority: "" } },
    };
    expect(() => validateSnapshot(broken)).toThrow(/citations.goingRate/);
  });

  it("requires occupation keys to match their row codes", () => {
    const broken = {
      ...snapshot,
      occupations: { ...snapshot.occupations, "9999": { ...snapshot.occupations["2136"] } },
    };
    expect(() => validateSnapshot(broken)).toThrow(/does not match its key/);
  });

  it("produces a different hash for any content change", () => {
    const { id: _a, ...body } = snapshot;
    const before = contentHash(body);
    const after = contentHash({ ...body, hourlyFloorGbp: 17.14 });
    expect(after).not.toBe(before);
  });
});

describe("the shipped snapshot is honest about itself", () => {
  it("is marked unverified", () => {
    expect(snapshot.verified).toBe(false);
  });

  it("names its primary sources", () => {
    expect(snapshot.provenance.sources.length).toBeGreaterThan(0);
    for (const source of snapshot.provenance.sources) {
      expect(source).toMatch(/^https:\/\/(www\.)?gov\.uk\//);
    }
  });

  it("records caveats saying what has not been verified", () => {
    expect(snapshot.provenance.caveats.length).toBeGreaterThan(0);
    expect(snapshot.provenance.caveats.join(" ")).toMatch(/UNVERIFIED|ILLUSTRATIVE/);
  });
});

describe("staleness", () => {
  it("measures age against a supplied clock, not the wall clock", () => {
    expect(snapshotAgeDays(snapshot, new Date("2026-08-14T00:00:00Z"))).toBe(0);
    expect(snapshotAgeDays(snapshot, new Date("2026-08-28T00:00:00Z"))).toBe(14);
    expect(snapshotAgeDays(snapshot, new Date("2026-09-01T00:00:00Z"))).toBe(18);
  });

  it("crosses the stale threshold at the documented point", () => {
    expect(snapshotAgeDays(snapshot, new Date("2026-09-01T00:00:00Z"))).toBeGreaterThan(
      STALE_SNAPSHOT_DAYS
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Diffing · AC-6 and journey J4
// ─────────────────────────────────────────────────────────────────────────────

function reseal(body: Omit<RulesSnapshot, "id">): RulesSnapshot {
  return { ...body, id: expectedId(body) } as RulesSnapshot;
}

describe("snapshot diffing", () => {
  const { id: _id, ...base } = snapshot;

  it("reports no change against itself", () => {
    const diff = diffSnapshots(snapshot, snapshot);
    expect(diff.material).toBe(false);
    expect(diff.globals).toHaveLength(0);
    expect(diff.occupationsChanged).toHaveLength(0);
  });

  it("names the occupation row whose going rate moved", () => {
    const next = reseal({
      ...base,
      effectiveDate: "2026-11-14",
      occupations: {
        ...base.occupations,
        "2136": { ...base.occupations["2136"], goingRateGbp: 51_200 },
      },
    });
    const diff = diffSnapshots(snapshot, next);
    expect(diff.material).toBe(true);
    expect(diff.occupationsChanged).toHaveLength(1);
    expect(diff.occupationsChanged[0].code).toBe("2136");
    expect(diff.occupationsChanged[0].changes[0]).toEqual({
      field: "goingRateGbp",
      from: 49_400,
      to: 51_200,
    });
  });

  it("reports a threshold change as a global", () => {
    const next = reseal({ ...base, generalSalaryThresholdGbp: 43_000 });
    const diff = diffSnapshots(snapshot, next);
    expect(diff.globals).toEqual([
      { field: "generalSalaryThresholdGbp", from: 41_700, to: 43_000 },
    ]);
    expect(diff.material).toBe(true);
  });

  it("distinguishes added from removed occupations", () => {
    const { "6135": _removed, ...remaining } = base.occupations;
    const next = reseal({
      ...base,
      occupations: {
        ...remaining,
        "2140": { ...base.occupations["2136"], code: "2140", title: "New occupation" },
      },
    });
    const diff = diffSnapshots(snapshot, next);
    expect(diff.occupationsAdded).toEqual(["2140"]);
    expect(diff.occupationsRemoved).toEqual(["6135"]);
    expect(diff.material).toBe(true);
  });

  it("re-flags only the saved checks a row change can move", () => {
    const next = reseal({
      ...base,
      occupations: {
        ...base.occupations,
        "2136": { ...base.occupations["2136"], goingRateGbp: 51_200 },
      },
    });
    const diff = diffSnapshots(snapshot, next);
    expect(codesAffectedBy(diff, ["2136", "2139", "2421"])).toEqual(["2136"]);
  });

  it("re-flags every saved check when a global moves", () => {
    const next = reseal({ ...base, generalSalaryThresholdGbp: 43_000 });
    const diff = diffSnapshots(snapshot, next);
    expect(codesAffectedBy(diff, ["2136", "2139", "2421"])).toEqual(["2136", "2139", "2421"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOC ranking · AC-4
// ─────────────────────────────────────────────────────────────────────────────

describe("occupation code ranking", () => {
  it("drops stop words and seniority prefixes", () => {
    const tokens = tokenise("Senior Lead QA Engineer");
    expect(tokens).not.toContain("senior");
    expect(tokens).not.toContain("lead");
  });

  it("expands domain shorthand into occupation vocabulary", () => {
    expect(tokenise("SDET")).toEqual(expect.arrayContaining(["software", "development", "test"]));
  });

  it("ranks software development for an automation engineering title", () => {
    const candidates = rankSocCandidates({
      title: "Senior QA Automation Engineer",
      duties: "Designs and builds automated test suites in TypeScript.",
      snapshot,
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.map((c) => c.code)).toContain("2136");
  });

  it("never returns an ineligible occupation as a candidate", () => {
    const candidates = rankSocCandidates({ title: "Care worker home carer", snapshot });
    expect(candidates.map((c) => c.code)).not.toContain("6135");
  });

  it("returns nothing rather than guessing on an empty title", () => {
    expect(rankSocCandidates({ title: "", snapshot })).toHaveLength(0);
    expect(rankSocCandidates({ title: "the and of", snapshot })).toHaveLength(0);
  });

  it("is deterministic and stably ordered", () => {
    const once = rankSocCandidates({ title: "Data analyst", snapshot });
    const twice = rankSocCandidates({ title: "Data analyst", snapshot });
    expect(JSON.stringify(once)).toBe(JSON.stringify(twice));
  });

  it("flags ambiguity when close candidates carry materially different rates", () => {
    const close = [
      { code: "2136", title: "a", rqfLevel: 6, goingRateGbp: 49_400, score: 0.5, matchedTerms: [] },
      { code: "2139", title: "b", rqfLevel: 6, goingRateGbp: 43_500, score: 0.42, matchedTerms: [] },
    ];
    expect(isAmbiguous(close)).toBe(true);
  });

  it("does not flag ambiguity when the rates are close together", () => {
    const close = [
      { code: "2136", title: "a", rqfLevel: 6, goingRateGbp: 49_400, score: 0.5, matchedTerms: [] },
      { code: "2137", title: "b", rqfLevel: 6, goingRateGbp: 49_600, score: 0.42, matchedTerms: [] },
    ];
    expect(isAmbiguous(close)).toBe(false);
  });

  it("does not flag ambiguity on a single candidate", () => {
    expect(isAmbiguous([])).toBe(false);
  });
});
