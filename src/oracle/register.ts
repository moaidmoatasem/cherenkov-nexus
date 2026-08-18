/**
 * Register of Licensed Sponsors — name matching.
 *
 * Replaces the substring matcher that produced the defect this module exists
 * to prevent: `LIKE '%wise%' LIMIT 1` against 126,998 rows returns
 * "Aaron Wise Limited" for a query of "Wise", and reports it as a verified
 * legal fact. An unranked `LIMIT 1` is not a match, it is the first row the
 * engine happened to reach.
 *
 * The discipline here is the same as SOC selection (AC-4): rank candidates,
 * report confidence, and refuse to pick when the top candidate is not
 * decisively ahead. A confident wrong answer is worse than an honest question.
 */

import type { Client } from "@libsql/client";
import { ConfirmedSponsor } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Legal-form suffixes and generic corporate words. Stripped for matching, but
 * only when they are not the entire name — "The Limited Company Ltd" keeps
 * enough to match on.
 */
const NOISE_TOKENS = new Set([
  "ltd", "limited", "plc", "llp", "lp", "llc", "inc", "incorporated",
  "co", "company", "corp", "corporation", "group", "holdings", "holding",
  "uk", "gb", "the", "and", "of", "services", "service", "international",
]);

/** Lowercase, strip punctuation and accents, collapse whitespace. */
export function normaliseName(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalised name with legal-form noise removed, falling back if that empties it. */
export function coreName(raw: string): string {
  const normalised = normaliseName(raw);
  const tokens = normalised.split(" ").filter(Boolean);
  const kept = tokens.filter((t) => !NOISE_TOKENS.has(t));
  return (kept.length > 0 ? kept : tokens).join(" ");
}

export function tokensOf(raw: string): string[] {
  return coreName(raw).split(" ").filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterCandidate {
  registeredName: string;
  route?: string;
  rating?: string;
  town?: string;
  county?: string;
  /** 0–1. Reported to the user; only ≥ AUTO_CONFIRM_SCORE may skip confirmation. */
  score: number;
  basis: "exact" | "normalised" | "prefix" | "tokens";
}

/**
 * A match at or above this is treated as unambiguous and confirmed
 * automatically. Everything below is offered to the user to confirm.
 *
 * Set high on purpose. The cost of an unnecessary confirmation click is one
 * click; the cost of a wrong sponsor on a verdict is the whole product.
 */
export const AUTO_CONFIRM_SCORE = 0.95;

/** Below this a candidate is not worth showing at all. */
export const MIN_CANDIDATE_SCORE = 0.34;

export function scoreMatch(query: string, candidate: string): { score: number; basis: RegisterCandidate["basis"] } {
  const qNorm = normaliseName(query);
  const cNorm = normaliseName(candidate);
  if (qNorm.length === 0 || cNorm.length === 0) return { score: 0, basis: "tokens" };

  if (qNorm === cNorm) return { score: 1, basis: "exact" };

  const qCore = coreName(query);
  const cCore = coreName(candidate);
  if (qCore === cCore) return { score: 0.97, basis: "normalised" };

  const qTokens = qCore.split(" ").filter(Boolean);
  const cTokens = cCore.split(" ").filter(Boolean);
  if (qTokens.length === 0 || cTokens.length === 0) return { score: 0, basis: "tokens" };

  // Prefix on a token boundary: "wise" against "wise payments" scores well,
  // "wise" against "aaron wise" does not. This is the case that fixes the
  // Wise / Aaron Wise Limited defect.
  const qLead = qTokens.join(" ");
  const cLead = cTokens.join(" ");
  if (cLead === qLead || cLead.startsWith(`${qLead} `) || qLead.startsWith(`${cLead} `)) {
    const shorter = Math.min(qTokens.length, cTokens.length);
    const longer = Math.max(qTokens.length, cTokens.length);
    // Decays as the longer name adds tokens the query never mentioned.
    return { score: 0.7 + 0.25 * (shorter / longer), basis: "prefix" };
  }

  // Jaccard over core tokens, penalised when the only overlap is a single
  // short token — that is how unrelated companies collide.
  const qSet = new Set(qTokens);
  const cSet = new Set(cTokens);
  const intersection = [...qSet].filter((t) => cSet.has(t));
  if (intersection.length === 0) return { score: 0, basis: "tokens" };

  const union = new Set([...qSet, ...cSet]).size;
  const jaccard = intersection.length / union;

  const weakOverlap = intersection.length === 1 && intersection[0].length <= 4;
  return { score: weakOverlap ? jaccard * 0.5 : jaccard * 0.9, basis: "tokens" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a normalised-name column and index.
 *
 * Without it, candidate retrieval over 127k rows means a full scan on every
 * check. With it, the common cases (exact and leading-token) are index hits.
 */
export async function ensureMatchIndex(db: Client): Promise<void> {
  const info = await db.execute("PRAGMA table_info(sponsors)");
  const columns = new Set(info.rows.map((r) => r.name as string));

  if (!columns.has("nameCore")) {
    await db.execute("ALTER TABLE sponsors ADD COLUMN nameCore TEXT");
  }
  await db.execute("CREATE INDEX IF NOT EXISTS idx_sponsors_name_core ON sponsors(nameCore)");

  const pending = await db.execute(
    "SELECT COUNT(*) AS n FROM sponsors WHERE nameCore IS NULL OR nameCore = ''"
  );
  const outstanding = Number(pending.rows[0]?.n ?? 0);
  if (outstanding === 0) return;

  // Backfill in chunks. Normalisation lives in TypeScript, not SQL, so the
  // matcher and the index can never disagree about what a name reduces to.
  const pageSize = 5000;
  for (;;) {
    const page = await db.execute({
      sql: "SELECT id, name FROM sponsors WHERE nameCore IS NULL OR nameCore = '' LIMIT ?",
      args: [pageSize],
    });
    if (page.rows.length === 0) break;
    await db.batch(
      page.rows.map((row) => ({
        sql: "UPDATE sponsors SET nameCore = ? WHERE id = ?",
        args: [coreName(row.name as string), row.id as number],
      })) as never
    );
    if (page.rows.length < pageSize) break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookup
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterLookup {
  /** Ranked, best first. Empty when nothing scored above the floor. */
  candidates: RegisterCandidate[];
  /** Set only when the top candidate is unambiguous. Otherwise the user confirms. */
  confirmed: ConfirmedSponsor | null;
  /** True when a human must choose between candidates before a verdict runs. */
  needsConfirmation: boolean;
}

function toConfirmed(c: RegisterCandidate, basis: ConfirmedSponsor["matchBasis"]): ConfirmedSponsor {
  return {
    registeredName: c.registeredName,
    route: c.route,
    rating: c.rating,
    town: c.town,
    county: c.county,
    matchBasis: basis,
  };
}

/**
 * Find licensed-sponsor candidates for a company name.
 *
 * Retrieval is deliberately generous and ranking is deliberately strict: pull
 * a bounded candidate set with cheap SQL, then score every candidate in
 * TypeScript where the logic is testable without a database.
 */
export async function lookupSponsor(
  db: Client,
  company: string,
  limit = 6
): Promise<RegisterLookup> {
  const query = (company ?? "").trim();

  // An empty company name previously matched `LIKE '%%'` and returned whatever
  // row came first — reporting "Google" as a verified sponsor for any posting.
  // There is no honest answer to an empty query.
  if (query.length < 2) {
    return { candidates: [], confirmed: null, needsConfirmation: false };
  }

  const core = coreName(query);
  if (core.length === 0) {
    return { candidates: [], confirmed: null, needsConfirmation: false };
  }

  const leadToken = core.split(" ")[0];

  const rows = await db.execute({
    sql: `SELECT name, route, typeRating, rating, town, county FROM sponsors
          WHERE nameCore = ?
             OR nameCore LIKE ?
             OR nameCore LIKE ?
          LIMIT 400`,
    args: [core, `${core} %`, `${leadToken} %`],
  });

  // A name whose distinctive token sits in the middle ("Aaron Wise") will not
  // be found by the leading-token probe. Widen once, bounded, when the first
  // probe found nothing.
  const widened =
    rows.rows.length === 0
      ? await db.execute({
          sql: `SELECT name, route, typeRating, rating, town, county FROM sponsors
                WHERE nameCore LIKE ? LIMIT 400`,
          args: [`%${leadToken}%`],
        })
      : rows;

  const scored: RegisterCandidate[] = widened.rows
    .map((row) => {
      const registeredName = row.name as string;
      const { score, basis } = scoreMatch(query, registeredName);
      return {
        registeredName,
        route: (row.route as string | null) ?? undefined,
        rating: ((row.rating ?? row.typeRating) as string | null) ?? undefined,
        town: (row.town as string | null) ?? undefined,
        county: (row.county as string | null) ?? undefined,
        score,
        basis,
      };
    })
    .filter((c) => c.score >= MIN_CANDIDATE_SCORE)
    .sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.registeredName.localeCompare(b.registeredName)
    )
    .slice(0, limit);

  if (scored.length === 0) {
    return { candidates: [], confirmed: null, needsConfirmation: false };
  }

  const top = scored[0];
  const runnerUp = scored[1];

  // A character-exact match against a registered name is the strongest signal
  // available, and asking the user to confirm it is friction with no safety
  // gain — unless two register rows both match exactly, which is a genuine
  // ambiguity the user has to resolve.
  const exactlyOne = top.score === 1 && (!runnerUp || runnerUp.score < 1);

  // Otherwise auto-confirm only when the top candidate is both strong in
  // absolute terms and clearly ahead of the next one. Two near-identical
  // scores mean two plausible companies, and that is a question for the user.
  const decisive =
    exactlyOne ||
    (top.score >= AUTO_CONFIRM_SCORE && (!runnerUp || top.score - runnerUp.score >= 0.1));

  return {
    candidates: scored,
    confirmed: decisive ? toConfirmed(top, top.basis === "exact" ? "exact" : "normalised") : null,
    needsConfirmation: !decisive,
  };
}

/** Wrap a user's explicit choice from the candidate list. */
export function confirmSponsor(candidate: RegisterCandidate): ConfirmedSponsor {
  return toConfirmed(candidate, "user_confirmed");
}
