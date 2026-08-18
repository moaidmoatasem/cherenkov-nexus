import { describe, it, expect, beforeAll } from "vitest";
import { existsSync } from "node:fs";
import {
  coreName,
  normaliseName,
  scoreMatch,
  tokensOf,
  lookupSponsor,
  ensureMatchIndex,
  AUTO_CONFIRM_SCORE,
} from "../../src/oracle/register";
import { getDb } from "../../src/server/db";

describe("normalisation", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normaliseName("  Monzo   Bank, Ltd.  ")).toBe("monzo bank ltd");
    expect(normaliseName("Checkout.com")).toBe("checkout com");
    expect(normaliseName("Marks & Spencer")).toBe("marks and spencer");
  });

  it("strips legal-form noise for the core name", () => {
    expect(coreName("Wise Payments Ltd")).toBe("wise payments");
    expect(coreName("Monzo Bank Limited")).toBe("monzo bank");
    expect(coreName("Revolut Ltd")).toBe("revolut");
    expect(coreName("ASML Netherlands B.V.")).toBe("asml netherlands b v");
  });

  it("keeps something to match on when a name is entirely noise", () => {
    expect(coreName("The Company Ltd")).toBe("the company ltd");
    expect(tokensOf("UK Limited").length).toBeGreaterThan(0);
  });
});

describe("scoring", () => {
  it("scores an exact match at 1", () => {
    expect(scoreMatch("Monzo Bank", "Monzo Bank").score).toBe(1);
  });

  it("scores a legal-suffix difference just below exact", () => {
    const { score, basis } = scoreMatch("Monzo Bank", "Monzo Bank Ltd");
    expect(basis).toBe("normalised");
    expect(score).toBeGreaterThanOrEqual(AUTO_CONFIRM_SCORE);
  });

  /**
   * The defect this module exists to prevent.
   *
   * `LIKE '%wise%' LIMIT 1` against the real register returns "Aaron Wise
   * Limited" for a query of "Wise", and the old code reported it as a verified
   * legal fact. Leading-token matching has to rank the real company above the
   * coincidental substring.
   */
  it("ranks a leading-token match above a mid-name coincidence", () => {
    const real = scoreMatch("Wise", "Wise Payments Ltd");
    const coincidence = scoreMatch("Wise", "Aaron Wise Limited");
    expect(real.score).toBeGreaterThan(coincidence.score);
    expect(real.basis).toBe("prefix");
  });

  it("penalises a single short token as the only overlap", () => {
    // "Arm" appearing inside an unrelated name must not read as a match.
    const { score } = scoreMatch("Arm", "Arm Yourself Security Limited");
    expect(score).toBeLessThan(AUTO_CONFIRM_SCORE);
  });

  it("scores unrelated names at zero", () => {
    expect(scoreMatch("Monzo Bank", "Greggs plc").score).toBe(0);
  });

  it("is symmetric for prefix relationships", () => {
    const a = scoreMatch("Deliveroo", "Deliveroo UK Ltd").score;
    const b = scoreMatch("Deliveroo UK Ltd", "Deliveroo").score;
    expect(a).toBe(b);
  });

  it("handles empty and punctuation-only input without throwing", () => {
    expect(scoreMatch("", "Monzo").score).toBe(0);
    expect(scoreMatch("...", "Monzo").score).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Against the real register
// ─────────────────────────────────────────────────────────────────────────────

const HAS_DB = existsSync("nexus.db");

describe.skipIf(!HAS_DB)("lookup against the licensed-sponsor register", () => {
  beforeAll(async () => {
    await ensureMatchIndex(getDb());
  }, 120_000);

  /**
   * SQLite has no `ALTER TABLE ADD COLUMN IF NOT EXISTS`, so two callers racing
   * on a fresh database both see the column missing and both try to add it. The
   * loser used to get `duplicate column name: nameCore` and the request 500'd.
   *
   * Not a test-only concern — two concurrent requests against a fresh install
   * race the same way. This is what turned CI red on the first push.
   */
  it("survives concurrent migrations without throwing", async () => {
    const results = await Promise.allSettled([
      ensureMatchIndex(getDb()),
      ensureMatchIndex(getDb()),
      ensureMatchIndex(getDb()),
    ]);
    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected.map((r) => String((r as PromiseRejectedResult).reason))).toEqual([]);
  }, 120_000);

  /**
   * The empty-company case. Previously `LIKE '%%'` matched every row and the
   * first one — "Google" — was returned as a verified sponsor for any posting
   * where the user had not typed a company name.
   */
  it("returns nothing for an empty or near-empty company name", async () => {
    for (const query of ["", " ", "a", "  .  "]) {
      const result = await lookupSponsor(getDb(), query);
      expect(result.candidates).toHaveLength(0);
      expect(result.confirmed).toBeNull();
    }
  });

  it("does not return a coincidental substring as the top match for Wise", async () => {
    const result = await lookupSponsor(getDb(), "Wise");
    if (result.candidates.length === 0) return; // register contents vary
    expect(result.candidates[0].registeredName).not.toBe("Aaron Wise Limited");
  });

  it("asks for confirmation rather than guessing when candidates are close", async () => {
    const result = await lookupSponsor(getDb(), "Northern Systems");
    if (result.confirmed === null) {
      expect(result.needsConfirmation).toBe(result.candidates.length > 0);
    } else {
      expect(result.confirmed.registeredName.length).toBeGreaterThan(0);
    }
  });

  it("returns candidates in descending score order", async () => {
    const result = await lookupSponsor(getDb(), "Digital");
    const scores = result.candidates.map((c) => c.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("never auto-confirms below the threshold", async () => {
    for (const query of ["Wise", "Digital", "Systems", "Technology"]) {
      const result = await lookupSponsor(getDb(), query);
      if (result.confirmed) {
        expect(result.candidates[0].score).toBeGreaterThanOrEqual(AUTO_CONFIRM_SCORE);
      }
    }
  });
});
