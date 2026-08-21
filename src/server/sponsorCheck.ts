import type { Client } from "@libsql/client";
import { getDb } from "./db";
import { MIN_CANDIDATE_SCORE, normaliseName, scoreMatch } from "../oracle/register";

/**
 * Resolving an employer against the Register of Licensed Sponsors.
 *
 * Lives apart from the route layer so the matching rules can be tested without
 * standing up a server: `server.ts` re-exports nothing and boots on import.
 */

export interface SponsorRecord {
  name: string;
  aliases: string[];
  region: "UK" | "Germany" | "Netherlands" | "Ireland" | "EU";
  licenseType: string;
  rating: string;
  minSalaryThresholdGbp: number;
}

export const SPONSORS_DATABASE: SponsorRecord[] = [
  { name: "Google", aliases: ["Google UK Ltd", "Alphabet", "Google DeepMind", "DeepMind"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Monzo Bank", aliases: ["Monzo", "Monzo Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Revolut", aliases: ["Revolut Ltd", "Revolut Technologies"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Amazon", aliases: ["AWS", "Amazon UK Services Ltd", "Amazon Web Services"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Microsoft", aliases: ["Microsoft Limited", "Microsoft UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Meta", aliases: ["Meta Platforms Ireland Ltd", "Facebook UK Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Bloomberg", aliases: ["Bloomberg LP", "Bloomberg Finance"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Deliveroo", aliases: ["Roofoods Ltd", "Deliveroo UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Wise", aliases: ["TransferWise", "Wise Payments Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Checkout.com", aliases: ["Checkout Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Spotify", aliases: ["Spotify Ltd", "Spotify AB"], region: "EU", licenseType: "EU Relocation / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Stripe", aliases: ["Stripe Payments Europe Ltd", "Stripe UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Arm", aliases: ["ARM Holdings", "Arm Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Graphcore", aliases: ["Graphcore Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Klarna", aliases: ["Klarna Bank AB", "Klarna UK"], region: "EU", licenseType: "EU Blue Card", rating: "Verified", minSalaryThresholdGbp: 41700 },
  { name: "Booking.com", aliases: ["Booking.com B.V.", "Booking Holdings"], region: "Netherlands", licenseType: "Highly Skilled Migrant (30% Ruling)", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "ASML", aliases: ["ASML Netherlands B.V."], region: "Netherlands", licenseType: "Highly Skilled Migrant", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "Adyen", aliases: ["Adyen N.V."], region: "Netherlands", licenseType: "Highly Skilled Migrant", rating: "IND Recognized", minSalaryThresholdGbp: 41700 },
  { name: "Zalando", aliases: ["Zalando SE"], region: "Germany", licenseType: "EU Blue Card (§18b AufenthG)", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "Personio", aliases: ["Personio SE & Co. KG"], region: "Germany", licenseType: "EU Blue Card", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "N26", aliases: ["N26 AG", "N26 Bank"], region: "Germany", licenseType: "EU Blue Card", rating: "Verified Sponsor", minSalaryThresholdGbp: 41700 },
  { name: "Starling Bank", aliases: ["Starling Bank Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Palantir", aliases: ["Palantir Technologies UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Canonical", aliases: ["Canonical Group Ltd", "Ubuntu"], region: "UK", licenseType: "Skilled Worker (Global Remote)", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Datadog", aliases: ["Datadog UK", "Datadog SAS"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "GitLab", aliases: ["GitLab Inc", "GitLab B.V."], region: "EU", licenseType: "Global Remote / Visa Transfer", rating: "Verified", minSalaryThresholdGbp: 41700 },
  { name: "GitHub", aliases: ["GitHub UK Ltd"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Shopify", aliases: ["Shopify UK", "Shopify Inc"], region: "UK", licenseType: "Global Remote / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Cloudflare", aliases: ["Cloudflare Limited"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Snowflake", aliases: ["Snowflake Computing UK"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Twilio", aliases: ["Twilio UK Ltd", "Twilio Ireland"], region: "UK", licenseType: "Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 },
  { name: "Bolt", aliases: ["Bolt Technology OU", "Bolt Services UK"], region: "EU", licenseType: "EU Blue Card / Skilled Worker", rating: "A Rating", minSalaryThresholdGbp: 41700 }
];

/**
 * Resolve a company against the Register of Licensed Sponsors.
 *
 * Retrieval is anchored on the registered name — never the unanchored
 * `LIKE '%query%'` this replaced, which returned an arbitrary row for any
 * short query — and ranking reuses the Oracle's scorer, so the quick check
 * and the Oracle agree about what counts as a match.
 */
export async function matchSponsorOnRegister(query: string, db: Client): Promise<string | null> {
  const lower = query.toLowerCase();
  const lead = lower.split(/\s+/)[0];
  const rows = await db.execute({
    sql: `SELECT name FROM sponsors
          WHERE LOWER(name) = ? OR LOWER(name) LIKE ? OR LOWER(name) LIKE ?
          LIMIT 200`,
    args: [lower, `${lower} %`, `${lead} %`],
  });

  const best = rows.rows
    .map((row) => {
      const registeredName = row.name as string;
      return { registeredName, ...scoreMatch(query, registeredName) };
    })
    .filter((candidate) => candidate.score >= MIN_CANDIDATE_SCORE)
    .sort((a, b) => b.score - a.score);

  // Same rule as the indexed path: only an unambiguous match counts.
  if (best.length === 0) return null;
  if (best.length > 1 && best[0].score - best[1].score < 0.1 && best[0].score < 1) return null;
  return best[0].registeredName;
}

export const VISA_TEXT_SIGNALS = [
  "visa sponsorship",
  "tier 2",
  "skilled worker visa",
  "relocation support",
  "relocation package",
  "visa support",
  "sponsorship provided",
  "sponsorship available",
  "eligible for visa",
  "right to work in the uk",
  "eu blue card",
  "30% ruling",
  "kennismigrant",
  "critical skills employment permit"
];

export type SponsorSource = "register" | "offline-list" | "none";

/**
 * Resolve an employer against the Register of Licensed Sponsors.
 *
 * Matching is delegated to the Oracle's register matcher, which normalises
 * names and scores candidates, rather than the unanchored `LIKE '%query%'`
 * this used to run: that returned an arbitrary row for any short query, so
 * "o" resolved to "Google" and reported it as a verified sponsor.
 *
 * Two signals are kept apart on purpose. Being on the register is a fact we
 * can check; a posting advertising sponsorship is the employer's own claim,
 * and collapsing the two into one boolean is what let an unverified employer
 * render as "Verified Visa Sponsor".
 */
export async function checkVisaSponsorship(
  companyName: string,
  text: string = "",
  db: Client = getDb()
) {
  const query = (companyName || "").trim();
  const lowerText = (text || "").toLowerCase();
  const postingClaimsSponsorship = VISA_TEXT_SIGNALS.some((signal) => lowerText.includes(signal));

  let matchedName: string | null = null;
  let minSalaryThresholdGbp: number | undefined;
  let source: SponsorSource = "none";
  let registerAvailable = true;

  // A one-character query cannot identify an employer; there is no honest
  // answer to give, so do not go looking for one.
  if (query.length >= 2) {
    try {
      // Deliberately index-free. The `nameCore` backfill takes several seconds
      // and holds the SQLite write lock while it runs; the Oracle routes build
      // it when someone actually uses the Oracle. This path is on the critical
      // route for every synthesis, so it must never wait on that.
      const match = await matchSponsorOnRegister(query, db);
      if (match) {
        matchedName = match;
        source = "register";
      }
    } catch (err) {
      registerAvailable = false;
      console.warn("Sponsor register unavailable; falling back to the offline list:", err);
    }

    // The bundled list is a last resort for an unreachable register, not a
    // supplement to it. It previously ran whenever the register simply found
    // nothing, and matched substrings in both directions, so a fictional
    // "Amazonia Fake Corp Ltd" resolved to "Amazon".
    if (!matchedName && !registerAvailable) {
      const normalisedQuery = normaliseName(query);
      const offline = SPONSORS_DATABASE.find(
        (sponsor) =>
          normaliseName(sponsor.name) === normalisedQuery ||
          sponsor.aliases.some((alias) => normaliseName(alias) === normalisedQuery)
      );
      if (offline) {
        matchedName = offline.name;
        minSalaryThresholdGbp = offline.minSalaryThresholdGbp;
        source = "offline-list";
      }
    }
  }

  return {
    /** True only when the employer was matched on the register. */
    isLicensedSponsor: Boolean(matchedName),
    matchedSponsor: matchedName ?? undefined,
    minSalaryThresholdGbp,
    /** Where the answer came from, so callers can describe it accurately. */
    sponsorSource: source,
    /** False when the register could not be consulted at all. */
    registerAvailable,
    /** The posting advertises sponsorship — the employer's claim, not a check. */
    postingClaimsSponsorship
  };
}
