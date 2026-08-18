/**
 * Occupation code suggestion.
 *
 * AC-4 is the single most important liability control in this product. The
 * sponsor bears sole responsibility for the code entered on a Certificate of
 * Sponsorship, and a wrong code causes refusal. If the Oracle ever silently
 * picks a code, a refused visa becomes attributable to the Oracle.
 *
 * So this module ranks and explains. It does not select. The evaluator refuses
 * an unconfirmed code outright (`UnconfirmedSocError`), which makes the rule
 * architectural rather than a convention someone can forget.
 *
 * The ranker is deterministic term matching, not a model. A model may later
 * propose codes on top of this, but it sits outside the verdict path and its
 * output still has to be confirmed by a human.
 */

import { RulesSnapshot, SocCandidate } from "./types";

/** Words that carry no occupational signal. */
const STOP_WORDS = new Set([
  "a", "an", "and", "the", "of", "for", "to", "in", "at", "on", "with", "or",
  "senior", "junior", "lead", "principal", "staff", "head", "chief", "deputy",
  "assistant", "associate", "trainee", "graduate", "intern", "apprentice",
  "i", "ii", "iii", "iv", "level", "grade", "band",
  "remote", "hybrid", "onsite", "contract", "permanent", "fulltime", "parttime",
  "uk", "london", "manchester", "edinburgh",
]);

/**
 * Title vocabulary that does not appear in the formal occupation titles.
 *
 * Deliberately small and explicit. This is a lookup table a human can audit,
 * not a learned mapping — when it is wrong, the wrongness is visible in a diff.
 */
const SYNONYMS: Record<string, string[]> = {
  sdet: ["software", "development", "test"],
  qa: ["quality", "test"],
  quality: ["quality", "test"],
  tester: ["test"],
  testing: ["test"],
  automation: ["test", "software"],
  developer: ["software", "programmer", "development"],
  dev: ["software", "development"],
  engineer: ["engineer", "professional"],
  programmer: ["programmer", "software"],
  devops: ["software", "systems"],
  sre: ["systems", "software"],
  platform: ["systems", "software"],
  backend: ["software", "programmer"],
  frontend: ["software", "programmer"],
  fullstack: ["software", "programmer"],
  data: ["data"],
  analyst: ["analyst"],
  scientist: ["scientist"],
  architect: ["architect", "professional"],
  nurse: ["nurse", "nursing"],
  nursing: ["nurse", "nursing"],
  accountant: ["accountant", "accounting"],
  teacher: ["teaching", "teacher"],
  solicitor: ["legal", "solicitor"],
};

export function tokenise(text: string): string[] {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  const expanded = new Set<string>();
  for (const token of base) {
    expanded.add(token);
    for (const syn of SYNONYMS[token] ?? []) expanded.add(syn);
  }
  return [...expanded];
}

export interface RankSocInput {
  title: string;
  /** Duties text from the posting. Duties decide the code, not the title. */
  duties?: string;
  snapshot: RulesSnapshot;
  limit?: number;
}

/**
 * Rank occupation codes against a posting.
 *
 * Title terms are weighted above duties terms because titles are terser and
 * higher-signal, but duties are included because the Immigration Rules are
 * explicit that duties decide the code. The UI says so too — the ranking is
 * a starting point for a human judgement, not a shortcut around it.
 */
export function rankSocCandidates(input: RankSocInput): SocCandidate[] {
  const { title, duties, snapshot, limit = 4 } = input;

  const titleTokens = new Set(tokenise(title));
  const dutyTokens = new Set(tokenise(duties ?? "").filter((t) => !titleTokens.has(t)));

  if (titleTokens.size === 0 && dutyTokens.size === 0) return [];

  const scored = Object.values(snapshot.occupations)
    .filter((row) => row.eligible)
    .map((row) => {
      const rowTokens = new Set(tokenise(row.title));

      const titleHits = [...titleTokens].filter((t) => rowTokens.has(t));
      const dutyHits = [...dutyTokens].filter((t) => rowTokens.has(t));

      // Normalise by the row's own vocabulary size so short occupation titles
      // do not automatically outrank descriptive ones.
      const denominator = Math.max(rowTokens.size, 1);
      const raw = (titleHits.length * 1.0 + dutyHits.length * 0.4) / denominator;

      return {
        code: row.code,
        title: row.title,
        rqfLevel: row.rqfLevel,
        goingRateGbp: row.goingRateGbp,
        score: Math.min(1, Number(raw.toFixed(4))),
        matchedTerms: [...titleHits, ...dutyHits].sort(),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.code.localeCompare(b.code)))
    .slice(0, limit);

  return scored;
}

/**
 * Whether two top candidates are close enough that the choice materially
 * changes the verdict.
 *
 * Journey J2 — the case that decides whether the product is trusted. When this
 * returns true the UI must show both rates side by side and say plainly that
 * the choice changes the answer.
 */
export function isAmbiguous(candidates: SocCandidate[], materialGbp = 2000): boolean {
  if (candidates.length < 2) return false;
  const [a, b] = candidates;
  const scoresClose = a.score - b.score < 0.15;
  const ratesDiffer = Math.abs(a.goingRateGbp - b.goingRateGbp) >= materialGbp;
  return scoresClose && ratesDiffer;
}
