/**
 * Sponsorship Eligibility Oracle — type contracts.
 *
 * Scope: UK Skilled Worker route only. Nothing in this module knows about
 * synthesis, Kanban, feeds, credentials, or LLMs. See NEXUS_V3.0_FINAL §5.
 *
 * Two invariants shape every type here:
 *
 *  AC-2  A verdict is a pure function of (posting, applicant, snapshot).
 *        No clock, no network, no randomness, no model. Everything the
 *        evaluator needs is an explicit input.
 *
 *  AC-7  Zero PII. The applicant record carries only the attributes the
 *        Immigration Rules actually test. No name, no date of birth, no
 *        passport, no address, no employer history. Where a rule depends on
 *        age we record the *basis of the claim* the applicant is making,
 *        never the birthday.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Citations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where a rule came from. Every constraint result carries one, so a verdict
 * can be argued against the published source rather than against the tool
 * (AC-3, and journey J5 in the operations doc).
 */
export interface Citation {
  /** e.g. "Appendix Skilled Worker", "Register of Licensed Sponsors (Workers)" */
  authority: string;
  /** e.g. "SW 14.2" */
  paragraph?: string;
  /** e.g. "Table 1" */
  table?: string;
  /** e.g. "2136" — the row within the table */
  row?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules snapshot
// ─────────────────────────────────────────────────────────────────────────────

/** One occupation row from Appendix Skilled Occupations. */
export interface OccupationRow {
  /** SOC 2020 code, e.g. "2136" */
  code: string;
  title: string;
  /** Regulated Qualifications Framework level for the occupation. */
  rqfLevel: number;
  /** Annual going rate in GBP, quoted at `goingRateBasisHours` per week. */
  goingRateGbp: number;
  /** Hours per week the quoted going rate assumes. */
  goingRateBasisHours: number;
  /** Whether the occupation is currently eligible for the route at all. */
  eligible: boolean;
  /** Free-text note where the row carries a caveat worth surfacing. */
  note?: string;
  /** Table the row was read from, for citation. */
  tableRef: string;
}

/**
 * A tradeable-points option (new entrant, PhD, shortage list, …).
 *
 * AC-5: these are *evaluated and reported*, never silently applied. The
 * evaluator computes what each option would require and whether the applicant
 * can claim it, then leaves the default-path verdict untouched.
 */
export interface TradeableOption {
  id: string;
  name: string;
  /** Percentage of the occupation going rate this option substitutes, e.g. 70. */
  goingRatePercent: number;
  /** Absolute salary floor that still applies under this option, if any. */
  absoluteFloorGbp?: number;
  /** Minimum RQF level the option applies to, if restricted. */
  appliesToRqfLevels?: number[];
  citation: Citation;
  /** How the applicant establishes the claim, shown in the UI. */
  basisHint: string;
}

/**
 * An immutable, content-addressed set of rules as published on one date.
 *
 * AC-6: snapshots are versioned and diffable. Every verdict pins exactly one
 * by `id`, so re-running a check months later reproduces it byte for byte.
 */
export interface RulesSnapshot {
  /** `{route}-{effectiveDate}+{contentHash}` — stable and self-verifying. */
  id: string;
  route: "uk-skilled-worker";
  /** Date the rules in this snapshot took effect (ISO date, no time). */
  effectiveDate: string;

  /**
   * False until every field has been checked against a primary source.
   *
   * A snapshot with `verified: false` produces verdicts stamped PROVISIONAL
   * and the API refuses to serve them unless the caller explicitly opts in.
   * This is the §2 discipline from NEXUS_V3.0_FINAL applied in code: data
   * without a named source, date, and measurement does not get to decide
   * anything.
   */
  verified: boolean;

  provenance: {
    /** Who or what produced this snapshot. */
    compiledBy: string;
    /** ISO timestamp of compilation. */
    compiledAt: string;
    /** URLs of the primary sources each section was read from. */
    sources: string[];
    /** Anything a reader must know before relying on it. */
    caveats: string[];
  };

  /** Appendix Skilled Worker general salary threshold, GBP/year. */
  generalSalaryThresholdGbp: number;
  /** Absolute hourly floor, GBP/hour. */
  hourlyFloorGbp: number;
  /** Hours-per-week cap applied when pro-rating a going rate. */
  goingRateHoursCap: number;
  /** Minimum RQF level for the route. */
  minRqfLevel: number;
  /** Minimum CEFR level for the English language requirement. */
  minEnglishCefr: CefrLevel;

  tradeableOptions: TradeableOption[];

  /** SOC 2020 code → occupation row. */
  occupations: Record<string, OccupationRow>;

  citations: {
    generalSalaryThreshold: Citation;
    hourlyFloor: Citation;
    skillLevel: Citation;
    english: Citation;
    goingRate: Citation;
    occupationEligibility: Citation;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * The basis on which a new-entrant claim is made.
 *
 * Deliberately not a date of birth (AC-7). We record the claim the applicant
 * says they can evidence; the Home Office tests the evidence, not us.
 */
export type NewEntrantBasis =
  | "under_26"
  | "switching_from_student"
  | "postdoctoral"
  | "working_toward_professional_qualification";

/** Only what the rules test. Nothing that identifies a person. */
export interface Applicant {
  /** Highest CEFR level the applicant can evidence. */
  englishCefr?: CefrLevel;
  /** Free-text evidence reference shown back to the user, e.g. "IELTS 7.5, Mar 2024". */
  englishEvidence?: string;
  /** Holds a PhD relevant to the occupation. */
  hasRelevantPhd?: boolean;
  /** That PhD is in a STEM subject. */
  phdIsStem?: boolean;
  /** Basis for a new-entrant claim, if any. */
  newEntrantBasis?: NewEntrantBasis;
}

/** The role being checked. Extracted from a public ATS feed, or entered by hand. */
export interface Posting {
  company: string;
  title: string;
  /** Annual gross salary in GBP. Absent means the check cannot complete. */
  salaryGbp?: number;
  /** Contracted hours per week. */
  hoursPerWeek?: number;
  location?: string;
  sourceUrl?: string;
  /** ISO timestamp the posting was read. Supplied by the caller, never Date.now(). */
  retrievedAt?: string;
}

/**
 * A sponsor-register match that a human has confirmed.
 *
 * The register matcher ranks candidates and reports confidence; it never
 * silently picks one. Same discipline as SOC selection (AC-4) — an unconfirmed
 * match cannot reach the evaluator.
 */
export interface ConfirmedSponsor {
  /** Organisation name exactly as it appears on the register. */
  registeredName: string;
  route?: string;
  rating?: string;
  town?: string;
  county?: string;
  /** How the match was made, for the audit trail. */
  matchBasis: "exact" | "normalised" | "user_confirmed";
}

// ─────────────────────────────────────────────────────────────────────────────
// Outputs
// ─────────────────────────────────────────────────────────────────────────────

export type ConstraintStatus = "satisfied" | "failed" | "not_applicable" | "undetermined";

export interface ConstraintResult {
  id: string;
  name: string;
  status: ConstraintStatus;
  /** One line, comparing actual against required. Rendered in the ledger. */
  detail: string;
  citation: Citation;
  /**
   * True on exactly one constraint when the outcome is INELIGIBLE or
   * CONDITIONAL: the first failure in statutory order (AC-1).
   */
  binding?: boolean;
}

export interface TradeableResult {
  id: string;
  name: string;
  /** Whether the applicant can claim this option at all. */
  claimable: boolean;
  /** Why not, when `claimable` is false. */
  reason: string;
  /** The salary this option would require, GBP/year. */
  requiredSalaryGbp?: number;
  /** Whether taking this option would clear the binding constraint. */
  wouldClearBinding: boolean;
  citation: Citation;
}

export type VerdictOutcome =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "CONDITIONAL"
  | "CANNOT_DETERMINE";

export interface Verdict {
  outcome: VerdictOutcome;
  /** The one rule that decides it. Null only when ELIGIBLE. */
  binding: ConstraintResult | null;
  /** Plain sentence naming the binding constraint. Never a score (AC-1). */
  statement: string;
  /** Every constraint, in statutory order, including the not-applicable ones. */
  constraints: ConstraintResult[];
  /** Evaluated, never applied (AC-5). */
  tradeable: TradeableResult[];

  /** The occupation code this verdict was computed against. */
  socCode: string;
  /** Always "user" — the evaluator refuses unconfirmed codes (AC-4). */
  socConfirmedBy: "user";

  sponsor: ConfirmedSponsor | null;

  snapshot: {
    id: string;
    effectiveDate: string;
    verified: boolean;
  };

  /** True when the snapshot is unverified. Rendered prominently. */
  provisional: boolean;

  /** Echoed inputs, so the verdict is self-contained on audit (AC-3). */
  inputs: {
    company: string;
    title: string;
    salaryGbp?: number;
    hoursPerWeek?: number;
    sourceUrl?: string;
    retrievedAt?: string;
  };

  /** AC-9. Present on every verdict, every export, every share. */
  disclaimer: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOC ranking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A suggested occupation code. Suggestions are ranked but never selected.
 *
 * AC-4 is the single most important liability control in the product: the
 * sponsor bears sole responsibility for the code on a Certificate of
 * Sponsorship, and a wrong code causes refusal. If this tool ever picks one,
 * a refused visa becomes attributable to the tool.
 */
export interface SocCandidate {
  code: string;
  title: string;
  rqfLevel: number;
  goingRateGbp: number;
  /** 0–1. Reported to the user; never used to auto-select. */
  score: number;
  /** Which tokens drove the score, so the user can sanity-check it. */
  matchedTerms: string[];
}

export class UnconfirmedSocError extends Error {
  constructor() {
    super(
      "Occupation code must be confirmed by the user before a verdict can be computed. " +
        "The Oracle suggests codes; it never selects one (AC-4)."
    );
    this.name = "UnconfirmedSocError";
  }
}
