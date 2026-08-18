/**
 * Oracle HTTP surface.
 *
 * Five endpoints, mapping onto journey J1 in the operations doc:
 *
 *   GET  /api/oracle/snapshot   what rules are loaded, how old, verified or not
 *   POST /api/oracle/posting    read a posting from a public ATS feed
 *   POST /api/oracle/sponsor    rank register candidates            (suggests)
 *   POST /api/oracle/soc        rank occupation codes               (suggests)
 *   POST /api/oracle/verdict    the verdict                         (decides)
 *
 * Only the last one decides anything, and it refuses to run without a
 * user-confirmed occupation code.
 *
 * No LLM is reachable from any of these paths.
 */

import { Router, Request, Response } from "express";
import type { Client } from "@libsql/client";
import { evaluate } from "./evaluate";
import {
  currentSnapshot,
  snapshotAgeDays,
  STALE_SNAPSHOT_DAYS,
  SnapshotIntegrityError,
} from "./snapshot";
import { confirmSponsor, ensureMatchIndex, lookupSponsor, RegisterCandidate } from "./register";
import { isAmbiguous, rankSocCandidates } from "./soc";
import { Applicant, ConfirmedSponsor, Posting, UnconfirmedSocError } from "./types";
import { fetchAtsJob } from "../server/integrations/atsConnector";

export interface OracleDeps {
  getDb: () => Client;
  /** Injectable so route behaviour stays testable (AC-2 discipline, extended). */
  now?: () => Date;
}

/** Hosts whose job feeds are public, unauthenticated and read-only (V1). */
const SUPPORTED_ATS = ["greenhouse.io", "lever.co", "ashbyhq.com"];

function isPublicAtsUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return SUPPORTED_ATS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Pull a plain integer out of a free-text salary range, best effort. */
export function parseSalaryGbp(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const matches = [...text.matchAll(/£\s?([\d,]+(?:\.\d+)?)\s*(k\b)?/gi)];
  if (matches.length === 0) return undefined;
  const values = matches
    .map((m) => {
      const n = Number(m[1].replace(/,/g, ""));
      if (!Number.isFinite(n)) return NaN;
      return m[2] ? n * 1000 : n;
    })
    .filter((n) => Number.isFinite(n) && n > 0);
  if (values.length === 0) return undefined;
  // A range advertises a band; the offer that matters for the rules is the one
  // on the Certificate of Sponsorship. Take the lower bound and let the user
  // correct it — over-reporting the salary would manufacture false eligibility.
  return Math.min(...values);
}

export function createOracleRouter(deps: OracleDeps): Router {
  const router = Router();
  const now = deps.now ?? (() => new Date());

  let indexReady: Promise<void> | null = null;
  function ensureIndex(): Promise<void> {
    if (!indexReady) {
      indexReady = ensureMatchIndex(deps.getDb()).catch((err) => {
        indexReady = null;
        throw err;
      });
    }
    return indexReady;
  }

  // ── Snapshot status ──────────────────────────────────────────────────────
  router.get("/snapshot", (_req: Request, res: Response) => {
    try {
      const snapshot = currentSnapshot();
      const ageDays = snapshotAgeDays(snapshot, now());
      res.json({
        id: snapshot.id,
        route: snapshot.route,
        effectiveDate: snapshot.effectiveDate,
        verified: snapshot.verified,
        ageDays,
        stale: ageDays > STALE_SNAPSHOT_DAYS,
        provenance: snapshot.provenance,
        thresholds: {
          generalSalaryThresholdGbp: snapshot.generalSalaryThresholdGbp,
          hourlyFloorGbp: snapshot.hourlyFloorGbp,
          minRqfLevel: snapshot.minRqfLevel,
          minEnglishCefr: snapshot.minEnglishCefr,
        },
        occupationCount: Object.keys(snapshot.occupations).length,
      });
    } catch (err) {
      res.status(503).json({ error: describe(err) });
    }
  });

  // ── Read a posting ───────────────────────────────────────────────────────
  router.post("/posting", async (req: Request, res: Response) => {
    const { url } = req.body ?? {};
    if (typeof url !== "string" || url.length === 0) {
      return res.status(400).json({ error: "A job posting URL is required." });
    }
    if (!isPublicAtsUrl(url)) {
      return res.status(422).json({
        error:
          "That host isn't one of the public ATS feeds this reads (Greenhouse, Lever, Ashby). Enter the details by hand instead.",
        supported: SUPPORTED_ATS,
      });
    }
    try {
      const job = await fetchAtsJob(url);
      const posting: Posting = {
        company: job.company,
        title: job.title,
        salaryGbp: parseSalaryGbp(job.salaryRange),
        location: job.location,
        sourceUrl: url,
        retrievedAt: now().toISOString(),
      };
      res.json({
        posting,
        duties: job.description.slice(0, 4000),
        salaryParsed: posting.salaryGbp !== undefined,
        salaryRaw: job.salaryRange,
        source: job.source,
      });
    } catch (err) {
      res.status(502).json({
        error: `Couldn't read that posting. Enter the details by hand, or paste the description. (${describe(err)})`,
      });
    }
  });

  // ── Sponsor candidates ───────────────────────────────────────────────────
  router.post("/sponsor", async (req: Request, res: Response) => {
    const { company } = req.body ?? {};
    if (typeof company !== "string") {
      return res.status(400).json({ error: "A company name is required." });
    }
    try {
      await ensureIndex();
      const result = await lookupSponsor(deps.getDb(), company);
      res.json({
        query: company,
        candidates: result.candidates,
        confirmed: result.confirmed,
        needsConfirmation: result.needsConfirmation,
        message:
          result.candidates.length === 0
            ? `${company || "That company"} isn't on the Register of Licensed Sponsors as at today's copy. It may be listed under a different legal name — try a variation.`
            : undefined,
      });
    } catch (err) {
      res.status(500).json({ error: describe(err) });
    }
  });

  // ── Occupation code candidates — suggests, never selects (AC-4) ──────────
  router.post("/soc", (req: Request, res: Response) => {
    const { title, duties } = req.body ?? {};
    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "A job title is required to suggest occupation codes." });
    }
    try {
      const snapshot = currentSnapshot();
      const candidates = rankSocCandidates({
        title,
        duties: typeof duties === "string" ? duties : undefined,
        snapshot,
      });
      res.json({
        candidates,
        ambiguous: isAmbiguous(candidates),
        mustConfirm: true,
        guidance:
          "Duties decide the code, not the job title. The going rate — and therefore the verdict — changes with the code you pick. This tool suggests; it never selects.",
        cascotUrl: "https://cascotweb.warwick.ac.uk/",
      });
    } catch (err) {
      res.status(503).json({ error: describe(err) });
    }
  });

  // ── The verdict ──────────────────────────────────────────────────────────
  router.post("/verdict", async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const {
      posting,
      applicant,
      socCode,
      socConfirmed,
      sponsorCandidate,
      allowProvisional,
    } = body as {
      posting?: Posting;
      applicant?: Applicant;
      socCode?: string;
      socConfirmed?: boolean;
      sponsorCandidate?: RegisterCandidate | null;
      allowProvisional?: boolean;
    };

    if (!posting || typeof posting.company !== "string" || typeof posting.title !== "string") {
      return res.status(400).json({ error: "A posting with a company and title is required." });
    }
    if (typeof socCode !== "string" || socCode.length === 0) {
      return res.status(400).json({ error: "An occupation code is required." });
    }
    if (socConfirmed !== true) {
      return res.status(422).json({
        error:
          "The occupation code must be confirmed by you before a verdict can be computed. The Oracle suggests codes; it never selects one.",
        code: "SOC_UNCONFIRMED",
      });
    }

    let snapshot;
    try {
      snapshot = currentSnapshot();
    } catch (err) {
      return res.status(503).json({ error: describe(err) });
    }

    // The rules data has not been verified against a primary source. Serving a
    // verdict from it without the caller saying so out loud would be exactly
    // the failure this whole module is built to prevent.
    if (!snapshot.verified && allowProvisional !== true) {
      return res.status(409).json({
        error:
          "The loaded rules snapshot is unverified. Verdicts computed from it are not reliable and are refused by default.",
        code: "SNAPSHOT_UNVERIFIED",
        snapshotId: snapshot.id,
        caveats: snapshot.provenance.caveats,
        retryWith: { allowProvisional: true },
      });
    }

    try {
      await ensureIndex();

      // A sponsor the user picked from the candidate list wins. Otherwise take
      // an unambiguous automatic match, and nothing else.
      let sponsor: ConfirmedSponsor | null = null;
      if (sponsorCandidate && typeof sponsorCandidate.registeredName === "string") {
        sponsor = confirmSponsor(sponsorCandidate);
      } else {
        const lookup = await lookupSponsor(deps.getDb(), posting.company);
        sponsor = lookup.confirmed;
        if (lookup.needsConfirmation && lookup.candidates.length > 0) {
          return res.status(422).json({
            error: "More than one company on the register could be this employer. Confirm which one.",
            code: "SPONSOR_UNCONFIRMED",
            candidates: lookup.candidates,
          });
        }
      }

      const verdict = evaluate({
        posting,
        applicant: applicant ?? {},
        sponsor,
        socCode,
        socConfirmed: true,
        snapshot,
      });

      const ageDays = snapshotAgeDays(snapshot, now());
      res.json({
        verdict,
        snapshotAgeDays: ageDays,
        snapshotStale: ageDays > STALE_SNAPSHOT_DAYS,
      });
    } catch (err) {
      if (err instanceof UnconfirmedSocError) {
        return res.status(422).json({ error: err.message, code: "SOC_UNCONFIRMED" });
      }
      res.status(500).json({ error: describe(err) });
    }
  });

  return router;
}

function describe(err: unknown): string {
  if (err instanceof SnapshotIntegrityError) return err.message;
  return err instanceof Error ? err.message : String(err);
}
