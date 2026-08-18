import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createOracleRouter, parseSalaryGbp } from "../../src/oracle/routes";
import { getDb } from "../../src/server/db";

describe("salary parsing", () => {
  it("reads a plain figure", () => {
    expect(parseSalaryGbp("£44,000")).toBe(44_000);
  });

  it("expands k notation", () => {
    expect(parseSalaryGbp("£55k")).toBe(55_000);
  });

  it("takes the lower bound of a range", () => {
    // Over-reporting the salary would manufacture eligibility that isn't there.
    expect(parseSalaryGbp("£44,000 - £58,000")).toBe(44_000);
    expect(parseSalaryGbp("£50k – £70k per annum")).toBe(50_000);
  });

  it("returns undefined when no figure is present", () => {
    expect(parseSalaryGbp("Competitive")).toBeUndefined();
    expect(parseSalaryGbp(undefined)).toBeUndefined();
    expect(parseSalaryGbp("")).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

let base: string;
let server: Server;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/oracle", createOracleRouter({ getDb, now: () => new Date("2026-08-18T09:14:00Z") }));
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/oracle`;
  return () => new Promise<void>((resolve) => server.close(() => resolve()));
}, 120_000);

const POSTING = {
  company: "Monzo Bank",
  title: "Senior QA Automation Engineer",
  salaryGbp: 44_000,
  hoursPerWeek: 37.5,
  retrievedAt: "2026-08-18T09:14:00Z",
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("GET /snapshot", () => {
  it("reports what rules are loaded and that they are unverified", async () => {
    const res = await fetch(`${base}/snapshot`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.verified).toBe(false);
    expect(body.route).toBe("uk-skilled-worker");
    expect(body.ageDays).toBe(4);
    expect(body.stale).toBe(false);
  });
});

describe("POST /posting", () => {
  it("refuses hosts outside the public ATS feeds", async () => {
    const res = await post("/posting", { url: "https://www.linkedin.com/jobs/view/123" });
    expect(res.status).toBe(422);
    expect(String(res.body.error)).toContain("public ATS feeds");
  });

  it("requires a URL", async () => {
    expect((await post("/posting", {})).status).toBe(400);
  });
});

describe("POST /soc", () => {
  it("suggests codes and insists they be confirmed", async () => {
    const res = await post("/soc", { title: "Senior QA Automation Engineer" });
    expect(res.status).toBe(200);
    expect(res.body.mustConfirm).toBe(true);
    expect(Array.isArray(res.body.candidates)).toBe(true);
    expect(String(res.body.guidance)).toContain("never selects");
  });

  it("requires a title", async () => {
    expect((await post("/soc", { title: "  " })).status).toBe(400);
  });
});

describe("POST /verdict", () => {
  it("refuses an unconfirmed occupation code", async () => {
    const res = await post("/verdict", { posting: POSTING, socCode: "2136", allowProvisional: true });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("SOC_UNCONFIRMED");
  });

  it("refuses to serve a verdict from an unverified snapshot by default", async () => {
    const res = await post("/verdict", { posting: POSTING, socCode: "2136", socConfirmed: true });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("SNAPSHOT_UNVERIFIED");
    expect(Array.isArray(res.body.caveats)).toBe(true);
    expect(res.body.retryWith).toEqual({ allowProvisional: true });
  });

  it("produces a verdict naming the binding constraint once provisional is acknowledged", async () => {
    const res = await post("/verdict", {
      posting: POSTING,
      applicant: { englishCefr: "B2" },
      socCode: "2136",
      socConfirmed: true,
      allowProvisional: true,
      sponsorCandidate: {
        registeredName: "Monzo Bank Ltd",
        route: "Worker",
        rating: "A rating",
        score: 1,
        basis: "exact",
      },
    });
    expect(res.status).toBe(200);
    const verdict = res.body.verdict as Record<string, unknown>;
    expect(verdict.outcome).toBe("INELIGIBLE");
    expect((verdict.binding as Record<string, unknown>).id).toBe("going_rate");
    expect(verdict.provisional).toBe(true);
    expect(String(verdict.disclaimer)).toContain("not immigration advice");
  });

  it("validates that a posting is present", async () => {
    const res = await post("/verdict", { socCode: "2136", socConfirmed: true });
    expect(res.status).toBe(400);
  });
});
