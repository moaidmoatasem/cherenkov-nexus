/**
 * The verdict function.
 *
 * This is the whole product. Everything else — feeds, dossiers, learning
 * bridges — is a projection of what this returns.
 *
 * AC-1  Every verdict names the binding constraint. Never a bare yes/no.
 *       Never a score.
 * AC-2  Pure function of (posting, applicant, sponsor, socCode, snapshot).
 *       No clock, no network, no randomness, no model. Byte-identical across
 *       runs.
 * AC-3  Every verdict cites its snapshot and the source rows it used.
 * AC-4  An unconfirmed occupation code throws rather than guessing.
 * AC-5  Tradeable-point paths are reported separately, never applied.
 */

import {
  Applicant,
  CEFR_ORDER,
  CefrLevel,
  ConfirmedSponsor,
  ConstraintResult,
  OccupationRow,
  Posting,
  RulesSnapshot,
  TradeableResult,
  UnconfirmedSocError,
  Verdict,
  VerdictOutcome,
} from "./types";

export const DISCLAIMER =
  "Informational only. This is not immigration advice and Cherenkov is not a regulated " +
  "immigration adviser. The occupation code was confirmed by you; the sponsor bears sole " +
  "responsibility for the code entered on a Certificate of Sponsorship. Rules change — a " +
  "verdict is valid only for the rules snapshot cited above.";

export interface EvaluateInput {
  posting: Posting;
  applicant: Applicant;
  /** Null means the company could not be confidently matched on the register. */
  sponsor: ConfirmedSponsor | null;
  /** SOC 2020 code, confirmed by the user. */
  socCode: string;
  /** Must be true. Guards AC-4 architecturally rather than by convention. */
  socConfirmed: boolean;
  snapshot: RulesSnapshot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers — deterministic, locale-independent
// ─────────────────────────────────────────────────────────────────────────────

/** £44,000 — fixed en-GB grouping, no Intl dependency, no locale drift. */
export function gbp(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}£${grouped}`;
}

/** £22.56 — two decimal places, same grouping rules. */
export function gbpPrecise(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, frac] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${amount < 0 ? "-" : ""}£${grouped}.${frac}`;
}

function cefrAtLeast(actual: CefrLevel, required: CefrLevel): boolean {
  return CEFR_ORDER.indexOf(actual) >= CEFR_ORDER.indexOf(required);
}

/**
 * Pro-rate a going rate quoted at one hours basis onto the contracted hours.
 *
 * Hours above the snapshot's cap do not increase the required salary — the cap
 * is a rules parameter, held in the snapshot rather than in code so it gets
 * verified alongside everything else.
 */
export function prorateGoingRate(
  row: OccupationRow,
  hoursPerWeek: number,
  hoursCap: number
): number {
  const effectiveHours = Math.min(hoursPerWeek, hoursCap);
  const ratio = effectiveHours / row.goingRateBasisHours;
  // Round to the pound. Rounding here (not at compare time) keeps the reported
  // threshold and the compared threshold identical.
  return Math.round(row.goingRateGbp * ratio);
}

// ─────────────────────────────────────────────────────────────────────────────
// The evaluator
// ─────────────────────────────────────────────────────────────────────────────

export function evaluate(input: EvaluateInput): Verdict {
  const { posting, applicant, sponsor, socCode, socConfirmed, snapshot } = input;

  if (!socConfirmed) throw new UnconfirmedSocError();

  const constraints: ConstraintResult[] = [];
  const occupation: OccupationRow | undefined = snapshot.occupations[socCode];

  // ── C1 · Sponsor licence ──────────────────────────────────────────────────
  constraints.push(
    sponsor
      ? {
          id: "sponsor_licence",
          name: "Sponsor holds a valid licence",
          status: "satisfied",
          detail: [sponsor.registeredName, sponsor.route, sponsor.rating]
            .filter(Boolean)
            .join(" · "),
          citation: { authority: "Register of Licensed Sponsors (Workers)" },
        }
      : {
          id: "sponsor_licence",
          name: "Sponsor holds a valid licence",
          status: "failed",
          detail: `${posting.company} could not be matched on the Register of Licensed Sponsors. It may be listed under a different legal name.`,
          citation: { authority: "Register of Licensed Sponsors (Workers)" },
        }
  );

  // ── C2 · Occupation eligible for the route ────────────────────────────────
  if (!occupation) {
    constraints.push({
      id: "occupation_eligible",
      name: "Occupation is eligible",
      status: "undetermined",
      detail: `Occupation code ${socCode} is not present in this rules snapshot. The check cannot complete.`,
      citation: snapshot.citations.occupationEligibility,
    });
  } else {
    constraints.push({
      id: "occupation_eligible",
      name: "Occupation is eligible",
      status: occupation.eligible ? "satisfied" : "failed",
      detail: occupation.eligible
        ? `SOC ${occupation.code} listed · ${occupation.tableRef}`
        : `SOC ${occupation.code} is not an eligible occupation for this route${occupation.note ? ` · ${occupation.note}` : ""}`,
      citation: { ...snapshot.citations.occupationEligibility, row: occupation.code },
    });
  }

  // ── C3 · Skill level ──────────────────────────────────────────────────────
  if (occupation) {
    const meets = occupation.rqfLevel >= snapshot.minRqfLevel;
    constraints.push({
      id: "skill_level",
      name: `Skill level at RQF ${snapshot.minRqfLevel} or above`,
      status: meets ? "satisfied" : "failed",
      detail: meets
        ? `RQF ${occupation.rqfLevel} · requirement is RQF ${snapshot.minRqfLevel}`
        : `RQF ${occupation.rqfLevel} · below the RQF ${snapshot.minRqfLevel} floor for this route`,
      citation: { ...snapshot.citations.skillLevel, row: occupation.code },
    });
  }

  // ── C4 · General salary threshold ─────────────────────────────────────────
  const salary = posting.salaryGbp;
  if (salary === undefined) {
    constraints.push({
      id: "general_threshold",
      name: "General salary threshold",
      status: "undetermined",
      detail:
        "This posting doesn't publish a salary. Enter it to continue — the threshold and going-rate checks both need it.",
      citation: snapshot.citations.generalSalaryThreshold,
    });
  } else {
    const meets = salary >= snapshot.generalSalaryThresholdGbp;
    constraints.push({
      id: "general_threshold",
      name: "General salary threshold",
      status: meets ? "satisfied" : "failed",
      detail: meets
        ? `${gbp(salary)} ≥ ${gbp(snapshot.generalSalaryThresholdGbp)}`
        : `${gbp(salary)} < ${gbp(snapshot.generalSalaryThresholdGbp)} · shortfall ${gbp(snapshot.generalSalaryThresholdGbp - salary)}`,
      citation: snapshot.citations.generalSalaryThreshold,
    });
  }

  // ── C5 · Occupation going rate ────────────────────────────────────────────
  const hours = posting.hoursPerWeek;
  let requiredGoingRate: number | undefined;

  if (occupation && salary !== undefined && hours !== undefined) {
    requiredGoingRate = prorateGoingRate(occupation, hours, snapshot.goingRateHoursCap);
    const meets = salary >= requiredGoingRate;
    const prorated = hours !== occupation.goingRateBasisHours;
    const basis = prorated
      ? `pro-rated from ${gbp(occupation.goingRateGbp)} at ${occupation.goingRateBasisHours} h/wk to ${hours} h/wk`
      : `${occupation.goingRateBasisHours} h/wk basis`;
    constraints.push({
      id: "going_rate",
      name: "Occupation going rate",
      status: meets ? "satisfied" : "failed",
      detail: meets
        ? `${gbp(salary)} ≥ ${gbp(requiredGoingRate)} · ${basis}`
        : `${gbp(salary)} < ${gbp(requiredGoingRate)} · shortfall ${gbp(requiredGoingRate - salary)} · ${basis}`,
      citation: { ...snapshot.citations.goingRate, row: occupation.code },
    });
  } else {
    constraints.push({
      id: "going_rate",
      name: "Occupation going rate",
      status: "undetermined",
      detail:
        salary === undefined
          ? "Needs a salary."
          : hours === undefined
            ? "Needs contracted hours per week — the going rate is pro-rated against them."
            : "Needs a resolved occupation row.",
      citation: snapshot.citations.goingRate,
    });
  }

  // ── C6 · Hourly floor ─────────────────────────────────────────────────────
  if (salary !== undefined && hours !== undefined && hours > 0) {
    const hourly = salary / (hours * 52);
    const meets = hourly >= snapshot.hourlyFloorGbp;
    constraints.push({
      id: "hourly_floor",
      name: "Hourly floor",
      status: meets ? "satisfied" : "failed",
      detail: meets
        ? `${gbpPrecise(hourly)}/h ≥ ${gbpPrecise(snapshot.hourlyFloorGbp)}/h`
        : `${gbpPrecise(hourly)}/h < ${gbpPrecise(snapshot.hourlyFloorGbp)}/h`,
      citation: snapshot.citations.hourlyFloor,
    });
  } else {
    constraints.push({
      id: "hourly_floor",
      name: "Hourly floor",
      status: "undetermined",
      detail: "Needs a salary and contracted hours per week.",
      citation: snapshot.citations.hourlyFloor,
    });
  }

  // ── C7 · English language ─────────────────────────────────────────────────
  if (!applicant.englishCefr) {
    constraints.push({
      id: "english",
      name: `English language, CEFR ${snapshot.minEnglishCefr}`,
      status: "undetermined",
      detail: "No English level on file. Add one to complete the check.",
      citation: snapshot.citations.english,
    });
  } else {
    const meets = cefrAtLeast(applicant.englishCefr, snapshot.minEnglishCefr);
    constraints.push({
      id: "english",
      name: `English language, CEFR ${snapshot.minEnglishCefr}`,
      status: meets ? "satisfied" : "failed",
      detail: meets
        ? `${applicant.englishCefr} on file${applicant.englishEvidence ? ` · ${applicant.englishEvidence}` : ""}`
        : `${applicant.englishCefr} on file · requirement is ${snapshot.minEnglishCefr}`,
      citation: snapshot.citations.english,
    });
  }

  // ── Binding constraint ────────────────────────────────────────────────────
  // First failure in statutory order. The array is already in that order, so
  // "first" is literal — no priority table to drift out of sync with the rules.
  const firstFailure = constraints.find((c) => c.status === "failed") ?? null;
  const anyUndetermined = constraints.some((c) => c.status === "undetermined");

  if (firstFailure) firstFailure.binding = true;

  // ── Tradeable points — evaluated, never applied (AC-5) ────────────────────
  const tradeable = evaluateTradeable({
    snapshot,
    occupation,
    applicant,
    salary,
    hours,
    binding: firstFailure,
  });

  // ── Outcome ───────────────────────────────────────────────────────────────
  let outcome: VerdictOutcome;
  if (firstFailure) {
    // CONDITIONAL only when a tradeable path the applicant can actually claim
    // would clear the binding constraint. A path they cannot claim leaves the
    // verdict INELIGIBLE — an unreachable alternative is not a condition.
    const rescued = tradeable.some((t) => t.claimable && t.wouldClearBinding);
    outcome = rescued ? "CONDITIONAL" : "INELIGIBLE";
  } else if (anyUndetermined) {
    outcome = "CANNOT_DETERMINE";
  } else {
    outcome = "ELIGIBLE";
  }

  return {
    outcome,
    binding: firstFailure,
    statement: buildStatement(outcome, firstFailure, constraints, socCode),
    constraints,
    tradeable,
    socCode,
    socConfirmedBy: "user",
    sponsor,
    snapshot: {
      id: snapshot.id,
      effectiveDate: snapshot.effectiveDate,
      verified: snapshot.verified,
    },
    provisional: !snapshot.verified,
    inputs: {
      company: posting.company,
      title: posting.title,
      salaryGbp: posting.salaryGbp,
      hoursPerWeek: posting.hoursPerWeek,
      sourceUrl: posting.sourceUrl,
      retrievedAt: posting.retrievedAt,
    },
    disclaimer: DISCLAIMER,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tradeable points
// ─────────────────────────────────────────────────────────────────────────────

function evaluateTradeable(args: {
  snapshot: RulesSnapshot;
  occupation: OccupationRow | undefined;
  applicant: Applicant;
  salary: number | undefined;
  hours: number | undefined;
  binding: ConstraintResult | null;
}): TradeableResult[] {
  const { snapshot, occupation, applicant, salary, hours, binding } = args;

  return snapshot.tradeableOptions.map((option) => {
    const { claimable, reason } = canClaim(option.id, applicant);

    // Does the option even apply to this occupation's skill level?
    const levelOk =
      !option.appliesToRqfLevels ||
      (occupation !== undefined && option.appliesToRqfLevels.includes(occupation.rqfLevel));

    if (!levelOk) {
      return {
        id: option.id,
        name: option.name,
        claimable: false,
        reason: occupation
          ? `Not applicable · applies to RQF ${option.appliesToRqfLevels!.join("/")} only, this occupation is RQF ${occupation.rqfLevel}`
          : "Not applicable · occupation unresolved",
        wouldClearBinding: false,
        citation: option.citation,
      };
    }

    let requiredSalaryGbp: number | undefined;
    if (occupation && hours !== undefined) {
      const fullRate = prorateGoingRate(occupation, hours, snapshot.goingRateHoursCap);
      const discounted = Math.round((fullRate * option.goingRatePercent) / 100);
      requiredSalaryGbp = Math.max(discounted, option.absoluteFloorGbp ?? 0);
    }

    // Would this option clear the binding constraint? Only meaningful when the
    // binding constraint is one the option can move — a salary rule.
    let wouldClearBinding = false;
    if (
      binding &&
      (binding.id === "going_rate" || binding.id === "general_threshold") &&
      salary !== undefined &&
      requiredSalaryGbp !== undefined
    ) {
      wouldClearBinding = salary >= requiredSalaryGbp;
    }

    const shortfall =
      salary !== undefined && requiredSalaryGbp !== undefined && salary < requiredSalaryGbp
        ? requiredSalaryGbp - salary
        : 0;

    const detail =
      requiredSalaryGbp === undefined
        ? reason
        : claimable
          ? // Name the basis even when the option clears — the user has to
            // evidence it to the sponsor, so the ledger has to say what it is.
            wouldClearBinding
            ? `${gbp(requiredSalaryGbp)} threshold · met · ${lowerFirst(reason)}`
            : `${gbp(requiredSalaryGbp)} threshold · still short by ${gbp(shortfall)} · ${lowerFirst(reason)}`
          : shortfall > 0
            ? `${gbp(requiredSalaryGbp)} threshold · still short by ${gbp(shortfall)} — and ${lowerFirst(reason)}`
            : `${gbp(requiredSalaryGbp)} threshold · ${lowerFirst(reason)}`;

    return {
      id: option.id,
      name: `${option.name} · ${option.goingRatePercent}% of going rate`,
      claimable,
      reason: detail,
      requiredSalaryGbp,
      wouldClearBinding: claimable && wouldClearBinding,
      citation: option.citation,
    };
  });
}

function canClaim(optionId: string, applicant: Applicant): { claimable: boolean; reason: string } {
  switch (optionId) {
    case "new_entrant":
      return applicant.newEntrantBasis
        ? { claimable: true, reason: `Claimed on the basis: ${humanBasis(applicant.newEntrantBasis)}` }
        : { claimable: false, reason: "No new-entrant basis declared" };
    case "phd_relevant":
      return applicant.hasRelevantPhd
        ? { claimable: true, reason: "Relevant PhD on file" }
        : { claimable: false, reason: "No relevant PhD on file" };
    case "phd_stem":
      return applicant.hasRelevantPhd && applicant.phdIsStem
        ? { claimable: true, reason: "Relevant STEM PhD on file" }
        : { claimable: false, reason: "No relevant STEM PhD on file" };
    default:
      // Unknown option: report it, do not silently treat it as claimable.
      return { claimable: false, reason: "Not evaluated — no basis recorded for this option" };
  }
}

function humanBasis(basis: NonNullable<Applicant["newEntrantBasis"]>): string {
  switch (basis) {
    case "under_26":
      return "under 26";
    case "switching_from_student":
      return "switching from a Student visa";
    case "postdoctoral":
      return "postdoctoral position";
    case "working_toward_professional_qualification":
      return "working toward a recognised professional qualification";
  }
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

// ─────────────────────────────────────────────────────────────────────────────
// The sentence
// ─────────────────────────────────────────────────────────────────────────────

function buildStatement(
  outcome: VerdictOutcome,
  binding: ConstraintResult | null,
  constraints: ConstraintResult[],
  socCode: string
): string {
  switch (outcome) {
    case "ELIGIBLE":
      return `Every constraint in this snapshot is satisfied for occupation code ${socCode}.`;
    case "CANNOT_DETERMINE": {
      const missing = constraints.filter((c) => c.status === "undetermined");
      return `The check cannot complete. ${missing[0]?.detail ?? "An input is missing."}`;
    }
    case "CONDITIONAL":
      return binding
        ? `The default path fails on ${binding.name.toLowerCase()} — ${binding.detail}. A tradeable-points option below would clear it, but it is not applied automatically and must be evidenced.`
        : "Conditional.";
    case "INELIGIBLE":
      return binding
        ? `${capitalise(binding.name)} — ${binding.detail}.`
        : "Not eligible.";
  }
}

function capitalise(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}
