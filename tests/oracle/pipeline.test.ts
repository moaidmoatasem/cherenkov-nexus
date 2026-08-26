import { describe, it, expect } from "vitest";
import {
  publish,
  runPipeline,
  sourceHash,
  summariseDiff,
  isSealed,
  UnapprovedPublishError,
  type FetchedSource,
  type GoldenCase,
  type ParsedRules,
  type PipelineInput,
} from "../../src/oracle/pipeline";
import { currentSnapshot } from "../../src/oracle/snapshot";
import { evaluate } from "../../src/oracle/evaluate";
import type { RulesSnapshot } from "../../src/oracle/types";

const live = currentSnapshot();
const { id: _id, verified: _v, provenance: _p, ...LIVE_RULES } = live;

const SOURCE: FetchedSource = {
  url: "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-skilled-occupations",
  body: "<html>appendix</html>",
  fetchedAt: "2026-08-25T09:00:00Z",
};

function input(over: Partial<PipelineInput> = {}): PipelineInput {
  return {
    source: SOURCE,
    parse: () => ({ ok: true, rules: LIVE_RULES as ParsedRules }),
    current: live,
    compiledBy: "test",
    ...over,
  };
}

/** Same rules, one going rate moved — the canonical material change. */
function withRateChange(rate: number): ParsedRules {
  return {
    ...LIVE_RULES,
    occupations: {
      ...LIVE_RULES.occupations,
      "2136": { ...LIVE_RULES.occupations["2136"], goingRateGbp: rate },
    },
  } as ParsedRules;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("change detection", () => {
  it("hashes the body, not the metadata", () => {
    const a = sourceHash(SOURCE);
    const b = sourceHash({ ...SOURCE, fetchedAt: "2027-01-01T00:00:00Z", url: "https://x" });
    expect(a).toBe(b);
    expect(sourceHash({ ...SOURCE, body: "different" })).not.toBe(a);
  });

  it("does no work when the source is byte-identical to last run", () => {
    let parsed = false;
    const outcome = runPipeline(
      input({
        currentSourceHash: sourceHash(SOURCE),
        parse: () => {
          parsed = true;
          return { ok: true, rules: LIVE_RULES as ParsedRules };
        },
      })
    );
    expect(outcome.status).toBe("unchanged");
    expect(parsed, "an unchanged source must not be parsed").toBe(false);
  });

  it("proceeds when the source hash differs", () => {
    const outcome = runPipeline(input({ currentSourceHash: "stale" }));
    expect(outcome.status).not.toBe("unchanged");
  });
});

describe("a bad parse never becomes a snapshot", () => {
  it("reports a parser that returns a failure", () => {
    const outcome = runPipeline(input({ parse: () => ({ ok: false, reason: "no table found" }) }));
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.reason).toContain("no table found");
  });

  it("contains a parser that throws", () => {
    const outcome = runPipeline(
      input({
        parse: () => {
          throw new Error("cheerio exploded");
        },
      })
    );
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.reason).toContain("cheerio exploded");
  });

  it("rejects a structurally invalid candidate using the loader's own validator", () => {
    const broken = { ...LIVE_RULES, minRqfLevel: "six" } as unknown as ParsedRules;
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: broken }) }));
    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.reason).toMatch(/validation/i);
  });

  it("rejects a candidate whose occupation rows lost their rates", () => {
    const broken = {
      ...LIVE_RULES,
      occupations: {
        ...LIVE_RULES.occupations,
        "2136": { ...LIVE_RULES.occupations["2136"], goingRateGbp: undefined },
      },
    } as unknown as ParsedRules;
    expect(runPipeline(input({ parse: () => ({ ok: true, rules: broken }) })).status).toBe("failed");
  });
});

describe("W1 §1 · a material change halts for sign-off", () => {
  it("halts when a going rate moves", () => {
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: withRateChange(51_200) }) }));
    expect(outcome.status).toBe("needs_signoff");
    if (outcome.status === "needs_signoff") {
      expect(outcome.diff.material).toBe(true);
      expect(outcome.summary).toContain("2136.goingRateGbp: 49400 → 51200");
    }
  });

  it("halts when a route-wide threshold moves", () => {
    const bumped = { ...LIVE_RULES, generalSalaryThresholdGbp: 43_000 } as ParsedRules;
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: bumped }) }));
    expect(outcome.status).toBe("needs_signoff");
  });

  it("halts when an occupation is removed", () => {
    const { "6135": _gone, ...rest } = LIVE_RULES.occupations;
    const shrunk = { ...LIVE_RULES, occupations: rest } as ParsedRules;
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: shrunk }) }));
    expect(outcome.status).toBe("needs_signoff");
    if (outcome.status === "needs_signoff") expect(outcome.summary).toContain("removed: 6135");
  });

  it("does not halt for a purely additive change", () => {
    const grown = {
      ...LIVE_RULES,
      occupations: {
        ...LIVE_RULES.occupations,
        "2141": { ...LIVE_RULES.occupations["2136"], code: "2141", title: "New occupation" },
      },
    } as ParsedRules;
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: grown }) }));
    expect(outcome.status).toBe("ready");
  });

  it("treats a first run as ready, with nothing to diff", () => {
    const outcome = runPipeline(input({ current: null }));
    expect(outcome.status).toBe("ready");
    if (outcome.status === "ready") expect(outcome.diff).toBeNull();
  });
});

describe("W1 §4 · golden-set regression", () => {
  /** A real verdict, not a stand-in: Monzo at £44k under code 2136. */
  const goldenVerdict: GoldenCase = {
    name: "monzo-2136-44k",
    run: (s: RulesSnapshot) =>
      evaluate({
        posting: { company: "Monzo Bank", title: "Senior QA", salaryGbp: 44_000, hoursPerWeek: 37.5 },
        applicant: { englishCefr: "B2" },
        sponsor: { registeredName: "Monzo Bank", matchBasis: "exact" },
        socCode: "2136",
        socConfirmed: true,
        snapshot: s,
      }).outcome,
    expected: "INELIGIBLE",
  };

  it("passes a candidate that preserves known-good verdicts", () => {
    const grown = {
      ...LIVE_RULES,
      occupations: {
        ...LIVE_RULES.occupations,
        "2141": { ...LIVE_RULES.occupations["2136"], code: "2141", title: "New occupation" },
      },
    } as ParsedRules;
    const outcome = runPipeline(
      input({ parse: () => ({ ok: true, rules: grown }), golden: [goldenVerdict] })
    );
    expect(outcome.status).toBe("ready");
  });

  /**
   * A parse that mangles a rate so badly the verdict flips must surface as a
   * regression, not as a rule change a reviewer might wave through.
   */
  it("blocks a candidate that flips a known-good verdict", () => {
    const mangled = withRateChange(30_000); // now £44k clears the going rate
    const outcome = runPipeline(
      input({ parse: () => ({ ok: true, rules: mangled }), golden: [goldenVerdict] })
    );
    expect(outcome.status).toBe("regressed");
    if (outcome.status === "regressed") {
      expect(outcome.failures).toHaveLength(1);
      expect(outcome.failures[0]).toMatchObject({
        name: "monzo-2136-44k",
        expected: "INELIGIBLE",
        actual: "ELIGIBLE",
      });
    }
  });

  it("records a golden case that throws as a failure rather than a pass", () => {
    const outcome = runPipeline(
      input({
        parse: () => ({ ok: true, rules: withRateChange(51_200) }),
        golden: [
          {
            name: "explodes",
            run: () => {
              throw new Error("boom");
            },
            expected: "anything",
          },
        ],
      })
    );
    expect(outcome.status).toBe("regressed");
    if (outcome.status === "regressed") expect(outcome.failures[0].actual).toContain("boom");
  });

  it("checks regressions before reporting a material change", () => {
    // withRateChange(30_000) is both material and verdict-flipping. Regression
    // must win, so a mangled parse is never presented as a rules update.
    const outcome = runPipeline(
      input({ parse: () => ({ ok: true, rules: withRateChange(30_000) }), golden: [goldenVerdict] })
    );
    expect(outcome.status).toBe("regressed");
  });
});

describe("publishing", () => {
  const signOff = {
    approvedBy: "M. Badawy",
    approvedAt: "2026-08-25T10:00:00Z",
    note: "Read Table 1 rows 2136 and 2139 against the published appendix.",
    readSourceTables: true,
  };

  function needsSignoff() {
    return runPipeline(input({ parse: () => ({ ok: true, rules: withRateChange(51_200) }) }));
  }

  it("refuses to publish a material change without sign-off", () => {
    expect(() => publish(needsSignoff())).toThrow(UnapprovedPublishError);
  });

  it("publishes a material change once signed off", () => {
    const snapshot = publish(needsSignoff(), signOff);
    expect(snapshot.occupations["2136"].goingRateGbp).toBe(51_200);
    expect(snapshot.provenance.caveats.join(" ")).toContain("M. Badawy");
  });

  it("never publishes a failure or a regression", () => {
    const failed = runPipeline(input({ parse: () => ({ ok: false, reason: "x" }) }));
    expect(() => publish(failed, signOff)).toThrow(UnapprovedPublishError);
    expect(() => publish({ status: "unchanged", sourceHash: "h" }, signOff)).toThrow(
      UnapprovedPublishError
    );
  });

  it("publishes a non-material change without sign-off", () => {
    const grown = {
      ...LIVE_RULES,
      occupations: {
        ...LIVE_RULES.occupations,
        "2141": { ...LIVE_RULES.occupations["2136"], code: "2141", title: "New occupation" },
      },
    } as ParsedRules;
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: grown }) }));
    expect(() => publish(outcome)).not.toThrow();
  });

  it("always seals what it publishes", () => {
    expect(isSealed(publish(needsSignoff(), signOff))).toBe(true);
    const outcome = runPipeline(input({ current: null }));
    if (outcome.status === "ready") expect(isSealed(outcome.proposed)).toBe(true);
  });
});

describe("verification is a human act", () => {
  it("never marks an automated candidate verified", () => {
    const outcome = runPipeline(input({ current: null }));
    if (outcome.status === "ready") {
      expect(outcome.proposed.verified).toBe(false);
      expect(outcome.proposed.provenance.caveats.join(" ")).toContain("Not verified");
    }
  });

  it("marks verified only when the approver read the source tables", () => {
    const outcome = runPipeline(input({ parse: () => ({ ok: true, rules: withRateChange(51_200) }) }));
    const yes = publish(outcome, {
      approvedBy: "A",
      approvedAt: "2026-08-25T10:00:00Z",
      note: "checked",
      readSourceTables: true,
    });
    expect(yes.verified).toBe(true);

    const no = publish(outcome, {
      approvedBy: "A",
      approvedAt: "2026-08-25T10:00:00Z",
      note: "diff looked fine",
      readSourceTables: false,
    });
    expect(no.verified).toBe(false);
    expect(no.provenance.caveats.join(" ")).toContain("NOT verified");
  });

  it("records the source url and body hash in provenance", () => {
    const outcome = runPipeline(input({ current: null }));
    if (outcome.status === "ready") {
      expect(outcome.proposed.provenance.sources).toContain(SOURCE.url);
      expect(outcome.proposed.provenance.caveats.join(" ")).toContain(
        sourceHash(SOURCE).slice(0, 12)
      );
    }
  });
});

describe("summariseDiff", () => {
  it("says so plainly when nothing changed", () => {
    expect(summariseDiff({
      from: "a", to: "b", globals: [], occupationsAdded: [], occupationsRemoved: [],
      occupationsChanged: [], material: false,
    })).toBe("no changes");
  });
});
