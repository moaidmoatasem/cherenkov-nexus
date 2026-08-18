import { describe, it, expect } from "vitest";
import { evaluate, gbp, gbpPrecise, prorateGoingRate, EvaluateInput } from "../../src/oracle/evaluate";
import { currentSnapshot } from "../../src/oracle/snapshot";
import { UnconfirmedSocError, Applicant, ConfirmedSponsor, Posting } from "../../src/oracle/types";

const snapshot = currentSnapshot();

const SPONSOR: ConfirmedSponsor = {
  registeredName: "Northwind Digital Ltd",
  route: "Worker",
  rating: "A rating",
  matchBasis: "exact",
};

const FLUENT: Applicant = { englishCefr: "B2", englishEvidence: "IELTS 7.5, Mar 2024" };

function check(overrides: {
  posting?: Partial<Posting>;
  applicant?: Applicant;
  sponsor?: ConfirmedSponsor | null;
  socCode?: string;
}): EvaluateInput {
  return {
    posting: {
      company: "Northwind Digital Ltd",
      title: "Senior QA Automation Engineer",
      salaryGbp: 44_000,
      hoursPerWeek: 37.5,
      sourceUrl: "https://boards.greenhouse.io/northwind/jobs/7714029",
      retrievedAt: "2026-08-18T09:14:00Z",
      ...overrides.posting,
    },
    applicant: overrides.applicant ?? FLUENT,
    sponsor: overrides.sponsor === undefined ? SPONSOR : overrides.sponsor,
    socCode: overrides.socCode ?? "2136",
    socConfirmed: true,
    snapshot,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("formatting", () => {
  it("formats GBP without locale dependence", () => {
    expect(gbp(44000)).toBe("£44,000");
    expect(gbp(1000000)).toBe("£1,000,000");
    expect(gbp(999)).toBe("£999");
    expect(gbp(0)).toBe("£0");
    expect(gbpPrecise(22.5641)).toBe("£22.56");
    expect(gbpPrecise(1234.5)).toBe("£1,234.50");
  });
});

describe("going-rate pro-rating", () => {
  const row = snapshot.occupations["2136"];

  it("returns the quoted rate at the basis hours", () => {
    expect(prorateGoingRate(row, 37.5, 48)).toBe(49_400);
  });

  it("scales down below the basis hours", () => {
    // Half time is half the rate.
    expect(prorateGoingRate(row, 18.75, 48)).toBe(24_700);
  });

  it("caps the uplift at the snapshot's hours cap", () => {
    const at48 = prorateGoingRate(row, 48, 48);
    const at60 = prorateGoingRate(row, 60, 48);
    expect(at60).toBe(at48);
    expect(at60).toBeGreaterThan(49_400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2 · determinism
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-2 · the verdict is a pure function", () => {
  it("is byte-identical across 100 runs", () => {
    const input = check({});
    const first = JSON.stringify(evaluate(input));
    for (let i = 0; i < 99; i += 1) {
      expect(JSON.stringify(evaluate(check({})))).toBe(first);
    }
  });

  it("does not mutate its inputs", () => {
    const input = check({});
    const before = JSON.stringify(input);
    evaluate(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("pins the snapshot it was computed against", () => {
    const verdict = evaluate(check({}));
    expect(verdict.snapshot.id).toBe(snapshot.id);
    expect(verdict.snapshot.effectiveDate).toBe("2026-08-14");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4 · the Oracle never selects an occupation code
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-4 · occupation code must be confirmed", () => {
  it("refuses to evaluate an unconfirmed code", () => {
    expect(() => evaluate({ ...check({}), socConfirmed: false })).toThrow(UnconfirmedSocError);
  });

  it("records that the user confirmed it", () => {
    expect(evaluate(check({})).socConfirmedBy).toBe("user");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1 · every verdict names the binding constraint
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-1 · binding constraint", () => {
  it("names exactly one binding constraint when a rule fails", () => {
    const verdict = evaluate(check({}));
    const bindings = verdict.constraints.filter((c) => c.binding);
    expect(bindings).toHaveLength(1);
    expect(verdict.binding?.id).toBe("going_rate");
  });

  it("states the shortfall in the sentence rather than a score", () => {
    const verdict = evaluate(check({}));
    expect(verdict.statement).toContain("£49,400");
    expect(verdict.statement).toContain("£5,400");
    expect(verdict.statement).not.toMatch(/\d+%/);
    expect(verdict.statement).not.toMatch(/score|match/i);
  });

  it("binds on the first failure in statutory order, not the worst one", () => {
    // Unlicensed sponsor AND salary below both thresholds: the licence is the
    // earlier constraint, so it binds.
    const verdict = evaluate(check({ sponsor: null, posting: { salaryGbp: 20_000 } }));
    expect(verdict.binding?.id).toBe("sponsor_licence");
  });

  it("has no binding constraint when everything is satisfied", () => {
    const verdict = evaluate(check({ posting: { salaryGbp: 55_000 } }));
    expect(verdict.outcome).toBe("ELIGIBLE");
    expect(verdict.binding).toBeNull();
    expect(verdict.constraints.every((c) => !c.binding)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3 · citations
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-3 · every constraint cites an authority", () => {
  it("attaches a named authority to every constraint", () => {
    const verdict = evaluate(check({}));
    for (const constraint of verdict.constraints) {
      expect(constraint.citation.authority.length).toBeGreaterThan(0);
    }
  });

  it("cites the specific occupation row on the going-rate constraint", () => {
    const verdict = evaluate(check({}));
    const goingRate = verdict.constraints.find((c) => c.id === "going_rate")!;
    expect(goingRate.citation.paragraph).toBe("SW 14.2");
    expect(goingRate.citation.row).toBe("2136");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5 · tradeable points are evaluated, never applied
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-5 · tradeable points", () => {
  it("reports an unclaimable option without applying it", () => {
    const verdict = evaluate(check({}));
    const newEntrant = verdict.tradeable.find((t) => t.id === "new_entrant")!;
    expect(newEntrant.claimable).toBe(false);
    expect(newEntrant.wouldClearBinding).toBe(false);
    // Still INELIGIBLE — an option the applicant cannot claim rescues nothing.
    expect(verdict.outcome).toBe("INELIGIBLE");
  });

  it("returns CONDITIONAL when a claimable option would clear the binding rule", () => {
    // 70% of £49,400 is £34,580; the applicant is at £44,000 and can claim.
    const verdict = evaluate(
      check({ applicant: { ...FLUENT, newEntrantBasis: "under_26" } })
    );
    const newEntrant = verdict.tradeable.find((t) => t.id === "new_entrant")!;
    expect(newEntrant.claimable).toBe(true);
    expect(newEntrant.requiredSalaryGbp).toBe(34_580);
    expect(newEntrant.wouldClearBinding).toBe(true);
    expect(verdict.outcome).toBe("CONDITIONAL");
    // The default-path verdict is untouched: the going rate still fails.
    expect(verdict.binding?.id).toBe("going_rate");
    expect(verdict.constraints.find((c) => c.id === "going_rate")!.status).toBe("failed");
  });

  it("keeps a claimable-but-insufficient option from rescuing the verdict", () => {
    // 90% of £49,400 is £44,460 — still above a £44,000 salary.
    const verdict = evaluate(check({ applicant: { ...FLUENT, hasRelevantPhd: true } }));
    const phd = verdict.tradeable.find((t) => t.id === "phd_relevant")!;
    expect(phd.claimable).toBe(true);
    expect(phd.requiredSalaryGbp).toBe(44_460);
    expect(phd.wouldClearBinding).toBe(false);
    expect(verdict.outcome).toBe("INELIGIBLE");
  });

  it("applies the option's absolute floor when it exceeds the percentage", () => {
    // 70% of £43,500 (code 2139) is £30,450, below the £33,400 floor.
    const verdict = evaluate(
      check({
        socCode: "2139",
        posting: { salaryGbp: 31_000 },
        applicant: { ...FLUENT, newEntrantBasis: "under_26" },
      })
    );
    const newEntrant = verdict.tradeable.find((t) => t.id === "new_entrant")!;
    expect(newEntrant.requiredSalaryGbp).toBe(33_400);
  });

  it("marks an option not applicable when the skill level rules it out", () => {
    const restricted = {
      ...snapshot,
      tradeableOptions: [
        {
          id: "shortage_list",
          name: "Temporary Shortage List",
          goingRatePercent: 80,
          appliesToRqfLevels: [3, 4, 5],
          citation: { authority: "Appendix Temporary Shortage List" },
          basisHint: "Occupation appears on the TSL.",
        },
      ],
    };
    const verdict = evaluate({ ...check({}), snapshot: restricted });
    const tsl = verdict.tradeable[0];
    expect(tsl.claimable).toBe(false);
    expect(tsl.reason).toContain("RQF 3/4/5");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Golden set — hand-reasoned scenarios, re-run against every new snapshot
// ─────────────────────────────────────────────────────────────────────────────

describe("golden set", () => {
  it("G1 · clears every constraint", () => {
    const v = evaluate(check({ posting: { salaryGbp: 52_000 } }));
    expect(v.outcome).toBe("ELIGIBLE");
    expect(v.binding).toBeNull();
  });

  it("G2 · salary below the going rate but above the general threshold", () => {
    const v = evaluate(check({ posting: { salaryGbp: 44_000 } }));
    expect(v.outcome).toBe("INELIGIBLE");
    expect(v.binding?.id).toBe("going_rate");
    expect(v.constraints.find((c) => c.id === "general_threshold")!.status).toBe("satisfied");
  });

  it("G3 · salary below the general threshold binds before the going rate", () => {
    const v = evaluate(check({ posting: { salaryGbp: 38_000 } }));
    expect(v.binding?.id).toBe("general_threshold");
  });

  it("G4 · occupation removed from the eligible list", () => {
    const v = evaluate(check({ socCode: "6135", posting: { salaryGbp: 60_000 } }));
    expect(v.outcome).toBe("INELIGIBLE");
    expect(v.binding?.id).toBe("occupation_eligible");
  });

  it("G5 · occupation below the RQF floor", () => {
    const v = evaluate(check({ socCode: "3132", posting: { salaryGbp: 60_000 } }));
    expect(v.outcome).toBe("INELIGIBLE");
    expect(v.binding?.id).toBe("skill_level");
    expect(v.binding?.detail).toContain("RQF 3");
  });

  it("G6 · company not on the register", () => {
    const v = evaluate(check({ sponsor: null }));
    expect(v.binding?.id).toBe("sponsor_licence");
    expect(v.binding?.detail).toContain("different legal name");
  });

  it("G7 · English below B2", () => {
    const v = evaluate(
      check({ posting: { salaryGbp: 52_000 }, applicant: { englishCefr: "B1" } })
    );
    expect(v.outcome).toBe("INELIGIBLE");
    expect(v.binding?.id).toBe("english");
  });

  it("G8 · missing salary cannot be determined, and says which input is missing", () => {
    const v = evaluate(check({ posting: { salaryGbp: undefined } }));
    expect(v.outcome).toBe("CANNOT_DETERMINE");
    expect(v.statement).toContain("doesn't publish a salary");
    expect(v.binding).toBeNull();
  });

  it("G9 · missing hours cannot be determined", () => {
    const v = evaluate(check({ posting: { hoursPerWeek: undefined } }));
    expect(v.outcome).toBe("CANNOT_DETERMINE");
    expect(v.constraints.find((c) => c.id === "going_rate")!.status).toBe("undetermined");
  });

  it("G10 · unknown occupation code cannot be determined rather than guessed", () => {
    const v = evaluate(check({ socCode: "9999" }));
    expect(v.outcome).toBe("CANNOT_DETERMINE");
    expect(v.constraints.find((c) => c.id === "occupation_eligible")!.status).toBe("undetermined");
  });

  it("G11 · part-time role pro-rates the going rate down", () => {
    // 20/37.5 of £49,400 is £26,347. £30,000 clears the going rate but fails
    // the general threshold, which is not pro-rated.
    const v = evaluate(check({ posting: { salaryGbp: 30_000, hoursPerWeek: 20 } }));
    expect(v.constraints.find((c) => c.id === "going_rate")!.status).toBe("satisfied");
    expect(v.binding?.id).toBe("general_threshold");
  });

  it("G12 · a failing hourly floor is reported even when salary rules pass", () => {
    // £42,000 over 60 h/wk is £13.46/h, below the £17.13 floor.
    const v = evaluate(check({ socCode: "2139", posting: { salaryGbp: 42_000, hoursPerWeek: 60 } }));
    const hourly = v.constraints.find((c) => c.id === "hourly_floor")!;
    expect(hourly.status).toBe("failed");
  });

  it("G13 · every constraint appears in the ledger, including satisfied ones", () => {
    const v = evaluate(check({}));
    expect(v.constraints.map((c) => c.id)).toEqual([
      "sponsor_licence",
      "occupation_eligible",
      "skill_level",
      "general_threshold",
      "going_rate",
      "hourly_floor",
      "english",
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-9 · disclaimer, and the provisional stamp
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-9 · disclaimer and provisional marking", () => {
  it("carries a disclaimer on every verdict", () => {
    for (const salary of [20_000, 44_000, 60_000]) {
      const v = evaluate(check({ posting: { salaryGbp: salary } }));
      expect(v.disclaimer).toContain("not immigration advice");
    }
  });

  it("marks verdicts provisional while the snapshot is unverified", () => {
    const v = evaluate(check({}));
    expect(snapshot.verified).toBe(false);
    expect(v.provisional).toBe(true);
  });

  it("drops the provisional flag once the snapshot is verified", () => {
    const v = evaluate({ ...check({}), snapshot: { ...snapshot, verified: true } });
    expect(v.provisional).toBe(false);
  });

  it("echoes its inputs so the verdict is self-contained on audit", () => {
    const v = evaluate(check({}));
    expect(v.inputs).toEqual({
      company: "Northwind Digital Ltd",
      title: "Senior QA Automation Engineer",
      salaryGbp: 44_000,
      hoursPerWeek: 37.5,
      sourceUrl: "https://boards.greenhouse.io/northwind/jobs/7714029",
      retrievedAt: "2026-08-18T09:14:00Z",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-7 · no PII in the applicant record
// ─────────────────────────────────────────────────────────────────────────────

describe("AC-7 · data minimisation", () => {
  it("keeps identifying fields out of the verdict entirely", () => {
    const serialised = JSON.stringify(evaluate(check({})));
    // Company and constraint names are expected; person-identifying fields are
    // the ones that must never appear.
    for (const field of [
      "dateOfBirth",
      "passport",
      "nationality",
      "address",
      "email",
      "phone",
      "fullName",
      "givenName",
      "familyName",
    ]) {
      expect(serialised).not.toContain(field);
    }
  });

  it("takes a new-entrant claim as a basis rather than a birthday", () => {
    const v = evaluate(check({ applicant: { ...FLUENT, newEntrantBasis: "under_26" } }));
    const newEntrant = v.tradeable.find((t) => t.id === "new_entrant")!;
    expect(newEntrant.reason).toContain("under 26");
    expect(JSON.stringify(v)).not.toMatch(/\d{4}-\d{2}-\d{2}T?.*birth/i);
  });
});
